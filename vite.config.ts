import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/super-bowl-squares/' : '/',
  build: {
    outDir: 'docs',
  },
}));
