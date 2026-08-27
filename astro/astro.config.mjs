// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://gg.pages.dev',
  build: {
    format: 'file',
  },
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
  },
});
