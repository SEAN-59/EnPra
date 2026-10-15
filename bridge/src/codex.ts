import { ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { StringDecoder } from 'node:string_decoder';

type PendingRequest = {
  reject: (error: Error) => void;
  resolve: (value: unknown) => void;
  method: string;
  timer: NodeJS.Timeout;
};

type CodexErrorDetails = {
  message?: string;
  code?: number | string;
  codexErrorInfo?: unknown;
  additionalDetails?: unknown;
  requestMethod?: string;
};

export class CodexRequestError extends Error {
  readonly code?: number | string;
  readonly codexErrorInfo?: unknown;
  readonly additionalDetails?: unknown;
  readonly requestMethod?: string;

  constructor(message: string, details: CodexErrorDetails = {}) {
    super(message);
    this.name = 'CodexRequestError';
    this.code = details.code;
    this.codexErrorInfo = details.codexErrorInfo;
    this.additionalDetails = details.additionalDetails;
    this.requestMethod = details.requestMethod;
  }
}

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
  outputMetadata?: {
    agentMessageCount: number;
    finalAnswerMessageCount: number;
    selectedMessageCount: number;
    selection: 'final_answer' | 'single_message';
  };
};

type CompletedTurn = {
  id?: string;
  status?: string;
  error?: CodexErrorDetails | null;
  items?: CompletedItem[];
};

type CompletedItem = {
  type?: string;
  text?: string;
  id?: string;
  phase?: 'commentary' | 'final_answer' | null;
};

type AgentMessageDelta = {
  delta?: string;
  itemId?: string;
  turnId?: string;
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
  private readonly completedItems = new Map<string, CompletedItem[]>();
  private readonly messageDeltas = new Map<string, Map<string, string>>();
  private readonly itemPhases = new Map<string, Map<string, CompletedItem['phase']>>();
  private readonly turnErrors = new Map<string, CodexErrorDetails>();
  private readonly turnWaiters = new Map<string, TurnWaiter>();
  private readonly initialization: Promise<void>;
  private stoppedError: CodexRequestError | null = null;
  private terminationTimer?: NodeJS.Timeout;
  private idleTimer?: NodeJS.Timeout;
  private retiring = false;
  private buffer = '';
  private readonly outputDecoder = new StringDecoder('utf8');
  private nextId = 1;
  private readonly workspace: string;

  constructor(home: string, private readonly onStop: () => void = () => {}) {
    mkdirSync(home, { recursive: true });
    this.workspace = join(home, 'workspace');
    mkdirSync(this.workspace, { recursive: true });
    this.child = spawn('codex', ['app-server', '--stdio'], {
      env: { ...process.env, CODEX_HOME: home },
      stdio: 'pipe',
    });
    this.child.stdout.on('data', (chunk: Buffer) => this.consume(this.outputDecoder.write(chunk)));
    this.child.stderr.on('data', () => undefined);
    this.child.on('exit', () => {
      clearTimeout(this.terminationTimer);
      this.stop(new CodexRequestError('Codex app server stopped.', { code: 'CODEX_SERVER_STOPPED' }));
    });
    this.child.on('error', () => this.stop(new CodexRequestError('Codex app server could not start.', { code: 'CODEX_SERVER_STOPPED' })));
    this.child.stdin.on('error', () => this.stop(new CodexRequestError('Codex app server input closed.', { code: 'CODEX_SERVER_STOPPED' }), true));
    this.initialization = this.request('initialize', {
      clientInfo: { name: 'enpra-bridge', title: 'EnPra', version: '0.2.0' },
      capabilities: { experimentalApi: false, requestAttestation: false },
    }).then(() => {
      if (this.stoppedError) throw this.stoppedError;
      this.child.stdin.write(`${JSON.stringify({ method: 'initialized' })}\n`);
    }).catch((error: Error) => {
      this.stop(error instanceof CodexRequestError ? error : new CodexRequestError('Codex app server could not initialize.', { code: 'CODEX_SERVER_STOPPED' }), true);
      throw error;
    });
    void this.initialization.catch(() => undefined);
  }

  get stopped() {
    return this.stoppedError !== null;
  }

  retire() {
    this.retiring = true;
    this.scheduleIdle(0);
  }

  private scheduleIdle(delay = 600_000) {
    clearTimeout(this.idleTimer);
    if (this.stoppedError) return;
    this.idleTimer = setTimeout(() => {
      if (this.pending.size || this.turnWaiters.size) this.scheduleIdle(this.retiring ? 1000 : 600_000);
      else this.stop(new CodexRequestError('Codex idle session closed.', {code:'CODEX_SERVER_STOPPED'}), true);
    },delay);
    this.idleTimer.unref();
  }

  private stop(error: CodexRequestError, terminate = false) {
    if (this.stoppedError) return;
    this.stoppedError = error;
    clearTimeout(this.idleTimer);
    this.onStop();
    for (const { reject, timer } of this.pending.values()) {
      clearTimeout(timer);
      reject(error);
    }
    this.pending.clear();
    for (const { reject, timer } of this.turnWaiters.values()) {
      clearTimeout(timer);
      reject(error);
    }
    this.turnWaiters.clear();
    this.completedTurns.clear();
    this.completedItems.clear();
    this.messageDeltas.clear();
    this.itemPhases.clear();
    this.turnErrors.clear();
    if (terminate) {
      this.child.kill();
      if (this.child.exitCode === null) {
        this.terminationTimer = setTimeout(() => this.child.kill('SIGKILL'), 5000);
        this.terminationTimer.unref();
      }
    }
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
    if (this.stoppedError) return;
    try {
      const message = JSON.parse(line) as {
        id?: number;
        result?: unknown;
        error?: CodexErrorDetails;
        method?: string;
        params?: unknown;
      };
      if (typeof message.id === 'number' && message.method) {
        this.child.stdin.write(`${JSON.stringify({ id: message.id, error: { code: -32601, message: 'Client requests are not supported.' } })}\n`);
        return;
      }
      if (typeof message.id === 'number' && !message.method) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        clearTimeout(pending.timer);
        if (message.error) pending.reject(new CodexRequestError(message.error.message ?? 'Codex request failed.', { ...message.error, requestMethod: pending.method }));
        else pending.resolve(message.result);
        return;
      }

      if (message.method === 'item/started') this.recordItemPhase(message.params as { turnId?: string; item?: CompletedItem });
      if (message.method === 'item/completed') this.recordCompletedItem(message.params as { turnId?: string; item?: CompletedItem });
      if (message.method === 'item/agentMessage/delta') this.recordAgentMessageDelta(message.params as AgentMessageDelta);
      if (message.method === 'error') {
        const params = message.params as { turnId?: string; error?: CodexErrorDetails };
        if (params?.turnId && params.error) this.turnErrors.set(params.turnId, params.error);
      }
      if (message.method === 'turn/completed') this.completeTurn(message.params as CompletedTurn & { id?: string; turn?: CompletedTurn });
    } catch {
      // Ignore non-protocol output from the child process.
    }
  }

  private recordCompletedItem(params: { turnId?: string; item?: CompletedItem }) {
    if (!params.turnId || !params.item) return;
    this.recordItemPhase(params);
    const items = this.completedItems.get(params.turnId) ?? [];
    items.push(params.item);
    this.completedItems.set(params.turnId, items);
  }

  private recordItemPhase(params: { turnId?: string; item?: CompletedItem }) {
    if (!params.turnId || !params.item?.id || params.item.phase == null) return;
    const phases = this.itemPhases.get(params.turnId) ?? new Map();
    phases.set(params.item.id, params.item.phase);
    this.itemPhases.set(params.turnId, phases);
  }

  private recordAgentMessageDelta(params: AgentMessageDelta) {
    if (!params.turnId || !params.itemId || typeof params.delta !== 'string') return;
    const messages = this.messageDeltas.get(params.turnId) ?? new Map<string, string>();
    messages.set(params.itemId, `${messages.get(params.itemId) ?? ''}${params.delta}`);
    this.messageDeltas.set(params.turnId, messages);
  }

  private completeTurn(params: CompletedTurn & { threadId?: string; turn?: CompletedTurn }) {
    const turn = params.turn;
    if (!turn?.id) return;

    const completedItems = this.completedItems.get(turn.id) ?? [];
    const streamedMessages = [...(this.messageDeltas.get(turn.id)?.entries() ?? [])]
      .filter(([, text]) => Boolean(text))
      .map(([id, text]) => ({ id, type: 'agentMessage', text, phase: this.itemPhases.get(turn.id!)?.get(id) }));
    const turnItems = turn.items ?? [];
    const itemsById = new Map<string, CompletedItem>();
    const itemsWithoutId: CompletedItem[] = [];
    for (const item of [...streamedMessages, ...completedItems, ...turnItems]) {
      if (!item.id) itemsWithoutId.push(item);
      else {
        const previous = itemsById.get(item.id);
        itemsById.set(item.id, { ...previous, ...item, phase: item.phase ?? previous?.phase });
      }
    }
    turn.items = [...itemsById.values(), ...itemsWithoutId];
    if (turn.status !== 'completed') turn.error = { ...this.turnErrors.get(turn.id), ...turn.error };
    this.completedItems.delete(turn.id);
    this.messageDeltas.delete(turn.id);
    this.itemPhases.delete(turn.id);
    this.turnErrors.delete(turn.id);

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
    if (this.stoppedError) return Promise.reject(this.stoppedError);
    const completed = this.completedTurns.get(turnId);
    if (completed) {
      this.completedTurns.delete(turnId);
      return Promise.resolve(completed);
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.stop(new CodexRequestError('Codex 응답 시간이 초과되었습니다. 다시 시도해 주세요.', {
          ...this.turnErrors.get(turnId), code: 'CODEX_TURN_TIMEOUT', requestMethod: 'turn/completed',
        }), true);
      }, 180_000);
      this.turnWaiters.set(turnId, { resolve, reject, timer });
    });
  }

  request(method: string, params: Record<string, unknown> = {}) {
    if (this.stoppedError) return Promise.reject(this.stoppedError);
    if (this.child.stdin.destroyed || !this.child.stdin.writable) {
      this.stop(new CodexRequestError('Codex app server input closed.', { code: 'CODEX_SERVER_STOPPED', requestMethod: method }), true);
      return Promise.reject(this.stoppedError);
    }
    const id = this.nextId++;
    this.scheduleIdle(this.retiring ? 1000 : 600_000);
    return new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => this.stop(new CodexRequestError('Codex 요청 시간이 초과되었습니다. 다시 시도해 주세요.', {
        code: 'CODEX_REQUEST_TIMEOUT', requestMethod: method,
      }), true), 30_000);
      this.pending.set(id, { resolve, reject, timer, method });
      try {
        this.child.stdin.write(`${JSON.stringify({ id, method, params })}\n`);
      } catch {
        this.stop(new CodexRequestError('Codex app server input closed.', { code: 'CODEX_SERVER_STOPPED', requestMethod: method }), true);
      }
    });
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

  async runLearningPrompt(prompt: string, outputSchema?: Record<string, unknown>): Promise<CodexCompletion> {
    await this.initialization;
    const startedThread = (await this.request('thread/start', {
      cwd: this.workspace,
      model: 'gpt-6-luna',
      serviceTier: 'priority',
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
      model: 'gpt-6-luna',
      effort: 'high',
      serviceTier: 'priority',
      input: [{ type: 'text', text: prompt, text_elements: [] }],
      approvalPolicy: 'never',
      sandboxPolicy: { type: 'readOnly', networkAccess: false },
      ...(outputSchema ? { outputSchema } : {}),
    })) as { turn?: { id?: string } };
    const turnId = startedTurn.turn?.id;
    if (!turnId) throw new Error('Codex 학습 요청을 시작하지 못했습니다.');

    const completedTurn = await this.waitForTurn(turnId);
    if (completedTurn.status !== 'completed') {
      throw new CodexRequestError(completedTurn.error?.message ?? 'Codex 학습 요청이 완료되지 않았습니다.', { ...completedTurn.error, requestMethod: 'turn/completed' });
    }

    const messages = (completedTurn.items ?? []).filter((item) => item.type === 'agentMessage' && typeof item.text === 'string');
    const finalAnswers = messages.filter((item) => item.phase === 'final_answer');
    const final = finalAnswers.at(-1);
    const selected = final ? [final] : messages.filter((item) => item.phase !== 'commentary');
    if (outputSchema && selected.length !== 1) {
      throw new CodexRequestError('Codex structured output did not contain one final message.', {
        code: 'CODEX_STRUCTURED_OUTPUT_AMBIGUOUS', requestMethod: 'turn/completed',
        additionalDetails: { agentMessageCount: messages.length, candidateMessageCount: selected.length },
      });
    }
    const text = outputSchema
      ? (selected[0]?.text ?? '').trim()
      : selected.map((item) => item.text).join('\n\n').trim();
    if (!text) throw new Error('Codex가 학습 응답을 반환하지 않았습니다.');

    return { threadId, turnId, text, ...(outputSchema ? { outputMetadata: {
      agentMessageCount: messages.length,
      finalAnswerMessageCount: finalAnswers.length,
      selectedMessageCount: selected.length,
      selection: final ? 'final_answer' as const : 'single_message' as const,
    } } : {}) };
  }
}

export class CodexRegistry {
  private readonly clients = new Map<string, CodexAppServer>();

  constructor(private readonly dataDir: string) {}

  get(userId: string) {
    let client = this.clients.get(userId);
    if (!client || client.stopped) {
      client = new CodexAppServer(join(this.dataDir, 'codex', userId), () => {
        if (this.clients.get(userId) === client) this.clients.delete(userId);
      });
      this.clients.set(userId, client);
    }
    return client;
  }

  async disconnect(userId: string) {
    const client = this.get(userId);
    try { await client.logout(); }
    finally {
      if (this.clients.get(userId) === client) this.clients.delete(userId);
      client.retire();
    }
  }
}
