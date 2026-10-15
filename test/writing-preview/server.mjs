import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/postcss';
import { writingRequest } from './routing.mjs';

const candidate = process.argv[2];
const port = Number(process.argv[3] ?? 4178);
if (![4178, 4179].includes(port))
  throw new Error('Use a designated loopback preview port.');
if (!/^\/tmp\/enpra-writing-preview\.[A-Za-z0-9]+$/.test(candidate ?? ''))
  throw new Error('Pass the prepared temporary NAS directory.');
const root = fileURLToPath(new URL('../..', import.meta.url));
const child = spawn(
  'ssh',
  [
    '-i',
    '/Users/sean/.ssh/github-actions-enpra',
    '-p',
    '64',
    '-o',
    'BatchMode=yes',
    '-o',
    'ConnectTimeout=10',
    '-o',
    'ServerAliveInterval=15',
    'dev_admin@100.69.209.124',
    `/usr/local/bin/docker exec -i -e ENPRA_WRITING_BROWSER_PREVIEW=1 ${port === 4179 ? '-e ENPRA_WRITING_PREVIEW_STAGE=5.0A ' : ''}enpra-bridge node ${candidate}/remote.mjs`,
  ],
  { stdio: ['pipe', 'pipe', 'pipe'] },
);
child.stderr.on('data', () => undefined);
let nextId = 0,
  ready = false;
const pending = new Map();
const lines = createInterface({ input: child.stdout });
lines.on('line', (line) => {
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    return;
  }
  if (message.event === 'ready') {
    ready = true;
    console.log(
      'Writing live preview ready: isolated database, real AI, 60-minute session.',
    );
  }
  if (message.event === 'ai_call')
    console.log(`Preview inference ${message.call}: ${message.kind}`);
  if (message.event === 'startup_failed')
    console.log(
      'Writing preview could not initialize; no credentials or raw errors are printed.',
    );
  if (message.event === 'closed')
    console.log(
      `Writing preview closed; rollback verified: ${message.rollbackVerified === true}`,
    );
  const request = pending.get(message.id);
  if (request) {
    clearTimeout(request.timer);
    pending.delete(message.id);
    request.resolve(message);
  }
});
function stopped() {
  ready = false;
  for (const request of pending.values()) {
    clearTimeout(request.timer);
    request.reject(new Error('Preview stopped'));
  }
  pending.clear();
}
child.on('exit', stopped);
child.on('error', stopped);
child.stdin.on('error', stopped);
function rpc(request) {
  if (!ready) return Promise.reject(new Error('Preview unavailable'));
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error('Preview timeout'));
      child.stdin.end();
    }, 240_000);
    pending.set(id, { resolve, reject, timer });
    child.stdin.write(JSON.stringify({ id, ...request }) + '\n');
  });
}
const server = await createServer({
  configFile: false,
  root: fileURLToPath(new URL('.', import.meta.url)),
  publicDir: `${root}/public`,
  resolve: {
    alias: {
      '@': root,
      'next/navigation': fileURLToPath(
        new URL('./navigation.jsx', import.meta.url),
      ),
    },
  },
  plugins: [
    react(),
    {
      name: 'isolated-writing-preview',
      configureServer(vite) {
        vite.middlewares.use(async (req, res, next) => {
          if (!req.url?.startsWith('/api/writing')) return next();
          const json = (status, data) => {
            res.statusCode = status;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-store');
            res.end(JSON.stringify(data));
          };
          // Reject cross-origin mutations and DNS-rebinding hosts; this endpoint only controls a disposable account.
          if (
            req.headers.host !== `127.0.0.1:${port}` ||
            (req.method !== 'GET' &&
              req.headers.origin !== `http://127.0.0.1:${port}`)
          )
            return json(403, {
              error: '로컬 테스트 화면에서만 요청할 수 있어요.',
            });
          if (!ready)
            return json(503, {
              error:
                '임시 AI 테스트 연결이 준비 중이거나 종료됐어요. Codex에 다시 연결을 요청해 주세요.',
            });
          let request;
          try {
            if (!['GET', 'POST'].includes(req.method))
              throw new Error('Invalid method');
            let body;
            if (req.method === 'POST') {
              let input = '';
              for await (const chunk of req) {
                input += chunk;
                if (Buffer.byteLength(input) > 65_536)
                  throw new Error('Body too large');
              }
              body = JSON.parse(input);
            }
            request = writingRequest(
              new URL(req.url, `http://127.0.0.1:${port}`).searchParams,
              body,
            );
          } catch {
            return json(400, { error: '올바른 테스트 요청이 아니에요.' });
          }
          try {
            const response = await rpc(request);
            json(response.status, response.data);
          } catch {
            json(503, {
              error: '임시 테스트 연결이 종료됐어요. 다시 연결해 주세요.',
            });
          }
        });
      },
    },
  ],
  css: { postcss: { plugins: [tailwind()] } },
  server: {
    host: '127.0.0.1',
    port,
    strictPort: true,
    fs: { allow: [root] },
  },
});
await server.listen();
server.printUrls();
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, async () => {
    child.stdin.end();
    await server.close();
  });
