import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ProjectOptions } from './prompts.js';

function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}

function packageJson(options: ProjectOptions): string {
  const deps: Record<string, string> = {
    '@agent-tale/astro-integration': '^0.0.1',
    '@agent-tale/theme-default': '^0.0.1',
    '@astrojs/react': '^5.0.0',
    astro: '^5.0.0',
    react: '^19.0.0',
    'react-dom': '^19.0.0',
  };

  if (options.template === 'agent') {
    deps['@agent-tale/mcp-server'] = '^0.0.1';
  }

  return JSON.stringify(
    {
      name: options.dir,
      private: true,
      version: '0.0.1',
      type: 'module',
      scripts: {
        dev: 'astro dev',
        build: 'astro build',
        preview: 'astro preview',
      },
      dependencies: deps,
    },
    null,
    2,
  ) + '\n';
}

function astroConfig(options: ProjectOptions): string {
  return `import { defineConfig } from 'astro/config';
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
`;
}

function tsconfig(): string {
  return JSON.stringify(
    {
      extends: 'astro/tsconfigs/strict',
      compilerOptions: {
        jsx: 'react-jsx',
        types: ['@agent-tale/astro-integration/virtual-modules'],
      },
    },
    null,
    2,
  ) + '\n';
}

function welcomePost(options: ProjectOptions): string {
  const today = new Date().toISOString().split('T')[0];
  return `---
title: Welcome to ${options.title}
slug: welcome
date: "${today}"
tags: [meta]
author: "${options.author}"
confidence: 0.9
abstract: "The first post. Every graph starts with a single node."
---

# Welcome

This is the first tale in **${options.title}**.

Every [[wikilink]] you write creates a connection in the graph. Try linking to [[about]] — even if it doesn't exist yet. Broken links become suggestions for future writing.

## What's a tale?

A tale is just a markdown file. But in Agent-Tale, every file is a node in a knowledge graph. Links between files become edges. Over time, your writing forms a web of connected ideas.

## What's next

- Write your [[second-post|second post]]
- Check the [[graph]] to see your connections grow
- Add more \`[[wikilinks]]\` to weave your tales together
`;
}

function aboutPost(options: ProjectOptions): string {
  const today = new Date().toISOString().split('T')[0];
  return `---
title: About
slug: about
date: "${today}"
tags: [meta]
author: "${options.author}"
confidence: 1.0
abstract: "About this blog."
---

# About ${options.title}

A graph-native blog built with [Agent-Tale](https://github.com/your-org/agent-tale).

Written by ${options.author}.
`;
}

function gardenReadme(): string {
  return `---
title: Start Here
slug: start-here
date: "${new Date().toISOString().split('T')[0]}"
tags: [meta, garden]
confidence: 0.8
abstract: "The entrance to the garden. Follow the wikilinks."
---

# Start Here

This is a [[digital-gardens|digital garden]] — a collection of interconnected notes that grow over time.

Unlike a blog, there's no chronological order. Follow the links. Get lost. That's the point.

## Seeds

- [[welcome]] — how this garden started
- [[about]] — who tends this garden

## How to navigate

Every \`[[wikilink]]\` is a doorway. Click one. See where it leads. Use the [[graph]] to see the big picture.
`;
}

function agentConfig(): string {
  return JSON.stringify(
    {
      mcpServers: {
        'agent-tale': {
          command: 'npx',
          args: ['@agent-tale/mcp-server', '--content-dir', './content'],
        },
      },
    },
    null,
    2,
  ) + '\n';
}

export function scaffold(targetDir: string, options: ProjectOptions): void {
  writeFile(path.join(targetDir, 'package.json'), packageJson(options));
  writeFile(path.join(targetDir, 'astro.config.mjs'), astroConfig(options));
  writeFile(path.join(targetDir, 'tsconfig.json'), tsconfig());

  // Starter content
  const postsDir = path.join(targetDir, 'content', 'posts');
  writeFile(path.join(postsDir, 'welcome.md'), welcomePost(options));
  writeFile(path.join(postsDir, 'about.md'), aboutPost(options));

  // Template-specific files
  if (options.template === 'garden') {
    writeFile(path.join(postsDir, 'start-here.md'), gardenReadme());
  }

  if (options.template === 'agent') {
    writeFile(path.join(targetDir, '.mcp.json'), agentConfig());
  }

  // .gitignore
  writeFile(
    path.join(targetDir, '.gitignore'),
    ['node_modules/', 'dist/', '.astro/', '.agent-tale/', ''].join('\n'),
  );
}
