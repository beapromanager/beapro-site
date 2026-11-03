import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

/**
 * The owner's dashboard, /ops/, built on its own AFTER the game (npm run build): a second, separate Rollup run, so the
 * game's build graph, chunks and file names are exactly what they were before the dashboard existed and nothing of the
 * dashboard (not even a shared React chunk) can end up on a player's phone. It writes into the same dist/ without
 * emptying it and without copying public/ again. In `npm run dev` the page is simply /ops/ on the dev server.
 */
export default defineConfig(() => ({
  base: '/',
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: { ops: fileURLToPath(new URL('./ops/index.html', import.meta.url)) },
      // every file of the dashboard starts with ops-, the lazy weekend tab too, so no dashboard file looks like the game's
      output: { chunkFileNames: 'assets/ops-[name]-[hash].js' },
    },
  },
}));
