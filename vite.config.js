import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Fully local build: no CDNs, no remote fonts, relative asset URLs so the
// production bundle can also be served from a sub-directory.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2022',
    sourcemap: false,
    assetsInlineLimit: 4096,
  },
  server: {
    port: 5173,
    open: false,
  },
});
