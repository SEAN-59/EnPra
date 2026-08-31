import { ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

type PendingRequest = {
  reject: (error: Error) => void;
  resolve: (value: unknown) => void;
};

export type CodexAccount = {
  email?: string | null;
  planType?: string | null;
  type?: 'chatgpt' | 'apiKey' | string;
};

export type DeviceLogin = {
  loginId: string;
  userCode: string;
  verificationUrl: string;
};

export type CodexCompletion = {
  threadId: string;
  turnId: string;
  text: string;
};

type CompletedTurn = {
  id?: string;
  status?: string;
  error?: { message?: string } | null;
  items?: Array<{ type?: string; text?: string }>;
};

type TurnWaiter = {
  reject: (error: Error) => void;
  resolve: (turn: CompletedTurn) => void;
  timer: NodeJS.Timeout;
};

class CodexAppServer {
  private readonly child: ChildProcessWithoutNullStreams;
  private readonly pending = new Map<number, PendingRequest>();
  private readonly completedTurns = new Map<string, CompletedTurn>();
  private readonly turnWaiters = new Map<string, TurnWaiter>();
  private readonly initialization: Promise<void>;
  private buffer = '';
  private nextId = 1;
  private readonly workspace: string;

  constructor(home: string) {
    mkdirSync(home, { recursive: true });
    this.workspace = join(home, 'workspace');
    mkdirSync(this.workspace, { recursive: true });
    this.child = spawn('codex', ['app-server', '--stdio'], {
      env: { ...process.env, CODEX_HOME: home },
      stdio: 'pipe',
    });
    this.child.stdout.on('data', (chunk: Buffer) => this.consume(chunk.toString()));
    this.child.stderr.on('data', () => undefined);
    this.child.on('exit', () => {
      for (const { reject } of this.pending.values()) reject(new Error('Codex app server stopped.'));
      this.pending.clear();
      for (const { reject, timer } of this.turnWaiters.values()) {
        clearTimeout(timer);
        reject(new Error('Codex app server stopped.'));
      }
      this.turnWaiters.clear();
    });
    this.initialization = this.request('initialize', {
      clientInfo: { name: 'enpra-bridge', title: 'EnPra', version: '0.2.0' },
      capabilities: { experimentalApi: false, requestAttestation: false },
    }).then(() => {
      this.child.stdin.write(`${JSON.stringify({ method: 'initialized' })}\n`);
    });
  }

  private consume(chunk: string) {
    this.buffer += chunk;
    let end = this.buffer.indexOf('\n');
    while (end >= 0) {
      const line = this.buffer.slice(0, end).trim();
      this.buffer = this.buffer.slice(end + 1);
      if (line) this.handle(line);
      end = this.buffer.indexOf('\n');
    }
  }

  private handle(line: string) {
    try {
      const message = JSON.parse(line) as {
        id?: number;
        result?: unknown;
        error?: { message?: string };
        method?: string;
        params?: unknown;
      };
      if (typeof message.id === 'number') {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message ?? 'Codex request failed.'));
        else pending.resolve(message.result);
        return;
      }

      if (message.method === 'turn/completed') this.completeTurn(message.params as CompletedTurn & { id?: string; turn?: CompletedTurn });
    } catch {
      // Ignore non-protocol output from the child process.
    }
  }

  private completeTurn(params: CompletedTurn & { threadId?: string; turn?: CompletedTurn }) {
    const turn = params.turn;
    if (!turn?.id) return;

    const waiter = this.turnWaiters.get(turn.id);
    if (!waiter) {
      this.completedTurns.set(turn.id, turn);
      return;
    }

    clearTimeout(waiter.timer);
    this.turnWaiters.delete(turn.id);
    waiter.resolve(turn);
  }

  private waitForTurn(turnId: string): Promise<CompletedTurn> {
    const completed = this.completedTurns.get(turnId);
    if (completed) {
      this.completedTurns.delete(turnId);
      return Promise.resolve(completed);
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.turnWaiters.delete(turnId);
        reject(new Error('Codex 응답 시간이 초과되었습니다. 다시 시도해 주세요.'));
      }, 180_000);
      this.turnWaiters.set(turnId, { resolve, reject, timer });
    });
  }

  request(method: string, params: Record<string, unknown> = {}) {
    const id = this.nextId++;
    this.child.stdin.write(`${JSON.stringify({ id, method, params })}\n`);
    return new Promise<unknown>((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  async startDeviceLogin(): Promise<DeviceLogin> {
    await this.initialization;
    const result = (await this.request('account/login/start', { type: 'chatgptDeviceCode' })) as {
      loginId?: string; userCode?: string; verificationUrl?: string; type?: string;
    };
    if (result.type !== 'chatgptDeviceCode' || !result.loginId || !result.userCode || !result.verificationUrl) {
      throw new Error('Codex did not return a device-login request.');
    }
    return { loginId: result.loginId, userCode: result.userCode, verificationUrl: result.verificationUrl };
  }

  async readAccount(): Promise<CodexAccount | null> {
    await this.initialization;
    const result = (await this.request('account/read', { refreshToken: false })) as { account?: CodexAccount | null };
    return result.account ?? null;
  }

  async logout() {
    await this.initialization;
    await this.request('account/logout');
  }

  async runLearningPrompt(prompt: string): Promise<CodexCompletion> {
    await this.initialization;
    const startedThread = (await this.request('thread/start', {
      cwd: this.workspace,
      approvalPolicy: 'never',
      sandbox: 'read-only',
      ephemeral: true,
      developerInstructions: [
        'You are EnPra, an English-learning assistant.',
        'Answer only the learner request in Korean unless the learner explicitly asks for another language.',
        'Do not run commands, access local files, browse the web, call tools, or perform actions outside this learning response.',
      ].join(' '),
    })) as { thread?: { id?: string } };
    const threadId = startedThread.thread?.id;
    if (!threadId) throw new Error('Codex 학습 세션을 시작하지 못했습니다.');

    const startedTurn = (await this.request('turn/start', {
      threadId,
      input: [{ type: 'text', text: prompt, text_elements: [] }],
      approvalPolicy: 'never',
      sandboxPolicy: { type: 'readOnly', networkAccess: false },
    })) as { turn?: { id?: string } };
    const turnId = startedTurn.turn?.id;
    if (!turnId) throw new Error('Codex 학습 요청을 시작하지 못했습니다.');

    const completedTurn = await this.waitForTurn(turnId);
    if (completedTurn.status !== 'completed') {
      throw new Error(completedTurn.error?.message ?? 'Codex 학습 요청이 완료되지 않았습니다.');
    }

    const text = (completedTurn.items ?? [])
      .filter((item) => item.type === 'agentMessage' && typeof item.text === 'string')
      .map((item) => item.text)
      .join('\n\n')
      .trim();
    if (!text) throw new Error('Codex가 학습 응답을 반환하지 않았습니다.');

    return { threadId, turnId, text };
  }
}

export class CodexRegistry {
  private readonly clients = new Map<string, CodexAppServer>();

  constructor(private readonly dataDir: string) {}

  get(userId: string) {
    let client = this.clients.get(userId);
    if (!client) {
      client = new CodexAppServer(join(this.dataDir, 'codex', userId));
      this.clients.set(userId, client);
    }
    return client;
  }
}
