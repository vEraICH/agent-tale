import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import node from '@astrojs/node';
import agentTale from '@agent-tale/astro-integration';
import { BUILD_NO } from './src/build.ts';

export default defineConfig({
  site: 'https://www.vra-lab.tech',
  adapter: node({ mode: 'standalone' }),
  server: { host: '0.0.0.0' },
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultColor: false,
    },
  },
  integrations: [
    react(),
    agentTale({ contentDir: './content' }),
  ],
  vite: {
    plugins: [tailwindcss()],
    define: {
      __BUILD_NO__: JSON.stringify(BUILD_NO),
    },
  },
});
