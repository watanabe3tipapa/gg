// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://watanabe3tipapa.github.io',
  base: '/gg',
  build: {
    format: 'file',
  },
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
  },
});
