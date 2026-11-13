import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true },
});

try {
  const mod = await server.ssrLoadModule('/src/sim/runBenchmark.ts');
  mod.main(process.argv.slice(2));
} finally {
  await server.close();
}
