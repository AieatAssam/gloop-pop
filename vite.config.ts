import { defineConfig } from 'vite';

export default defineConfig({
  base: '/gloop-pop/',
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    sourcemap: false,
  },
});
