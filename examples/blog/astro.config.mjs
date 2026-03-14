import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import agentTale from '@agent-tale/astro-integration';

export default defineConfig({
  site: 'https://example.com',
  integrations: [
    react(),
    agentTale({ contentDir: './content' }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
