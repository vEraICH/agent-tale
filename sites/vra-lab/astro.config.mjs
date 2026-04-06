import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import node from '@astrojs/node';
import agentTale from '@agent-tale/astro-integration';

export default defineConfig({
  site: 'https://www.vra-lab.tech',
  adapter: node({ mode: 'standalone' }),
  server: { host: '0.0.0.0' },
  integrations: [
    react(),
    agentTale({ contentDir: './content' }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
