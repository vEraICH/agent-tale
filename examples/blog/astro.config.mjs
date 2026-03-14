import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import agentTale from '@agent-tale/astro-integration';

export default defineConfig({
  site: 'https://example.com',
  integrations: [
    agentTale({ contentDir: './content' }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
