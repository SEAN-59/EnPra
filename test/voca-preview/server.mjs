import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/postcss';
const root = fileURLToPath(new URL('../..', import.meta.url));
const server = await createServer({
  configFile: false,
  root: fileURLToPath(new URL('.', import.meta.url)),
  publicDir: `${root}/public`,
  resolve: { alias: { '@': root } },
  plugins: [react()],
  css: { postcss: { plugins: [tailwind()] } },
  server: {
    host: '127.0.0.1',
    port: 4177,
    strictPort: true,
    fs: { allow: [root] },
  },
});
await server.listen();
server.printUrls();
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, async () => {
    await server.close();
    process.exit(0);
  });
