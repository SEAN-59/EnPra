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

class CodexAppServer {
  private readonly child: ChildProcessWithoutNullStreams;
  private readonly pending = new Map<number, PendingRequest>();
  private buffer = '';
  private nextId = 1;

  constructor(home: string) {
    mkdirSync(home, { recursive: true });
    this.child = spawn('codex', ['app-server', '--stdio'], {
      env: { ...process.env, CODEX_HOME: home },
      stdio: 'pipe',
    });
    this.child.stdout.on('data', (chunk: Buffer) => this.consume(chunk.toString()));
    this.child.stderr.on('data', () => undefined);
    this.child.on('exit', () => {
      for (const { reject } of this.pending.values()) reject(new Error('Codex app server stopped.'));
      this.pending.clear();
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
      const message = JSON.parse(line) as { id?: number; result?: unknown; error?: { message?: string } };
      if (typeof message.id !== 'number') return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message ?? 'Codex request failed.'));
      else pending.resolve(message.result);
    } catch {
      // Ignore non-protocol output from the child process.
    }
  }

  request(method: string, params: Record<string, unknown> = {}) {
    const id = this.nextId++;
    this.child.stdin.write(`${JSON.stringify({ id, method, params })}\n`);
    return new Promise<unknown>((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  async startDeviceLogin(): Promise<DeviceLogin> {
    const result = (await this.request('account/login/start', { type: 'chatgptDeviceCode' })) as {
      loginId?: string; userCode?: string; verificationUrl?: string; type?: string;
    };
    if (result.type !== 'chatgptDeviceCode' || !result.loginId || !result.userCode || !result.verificationUrl) {
      throw new Error('Codex did not return a device-login request.');
    }
    return { loginId: result.loginId, userCode: result.userCode, verificationUrl: result.verificationUrl };
  }

  async readAccount(): Promise<CodexAccount | null> {
    const result = (await this.request('account/read', { refreshToken: false })) as { account?: CodexAccount | null };
    return result.account ?? null;
  }

  async logout() { await this.request('account/logout'); }
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
