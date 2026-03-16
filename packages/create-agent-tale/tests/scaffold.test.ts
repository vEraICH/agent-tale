import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { scaffold } from '../src/scaffold.js';
import type { ProjectOptions } from '../src/prompts.js';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'agent-tale-test-'));
}

function readFile(dir: string, ...segments: string[]): string {
  return fs.readFileSync(path.join(dir, ...segments), 'utf-8');
}

function exists(dir: string, ...segments: string[]): boolean {
  return fs.existsSync(path.join(dir, ...segments));
}

describe('scaffold', () => {
  let tmpDir: string;
  let targetDir: string;

  const baseOptions: ProjectOptions = {
    dir: 'test-blog',
    title: 'Test Blog',
    author: 'Tester',
    template: 'minimal',
  };

  beforeEach(() => {
    tmpDir = makeTmpDir();
    targetDir = path.join(tmpDir, 'test-blog');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates project directory structure', () => {
    scaffold(targetDir, baseOptions);
    expect(exists(targetDir, 'package.json')).toBe(true);
    expect(exists(targetDir, 'astro.config.mjs')).toBe(true);
    expect(exists(targetDir, 'tsconfig.json')).toBe(true);
    expect(exists(targetDir, '.gitignore')).toBe(true);
    expect(exists(targetDir, 'content', 'posts', 'welcome.md')).toBe(true);
    expect(exists(targetDir, 'content', 'posts', 'about.md')).toBe(true);
  });

  it('writes valid package.json with correct name', () => {
    scaffold(targetDir, baseOptions);
    const pkg = JSON.parse(readFile(targetDir, 'package.json'));
    expect(pkg.name).toBe('test-blog');
    expect(pkg.dependencies['@agent-tale/astro-integration']).toBeDefined();
    expect(pkg.dependencies['@agent-tale/theme-default']).toBeDefined();
    expect(pkg.dependencies.astro).toBeDefined();
    expect(pkg.scripts.dev).toBe('astro dev');
  });

  it('writes astro.config.mjs with agent-tale integration', () => {
    scaffold(targetDir, baseOptions);
    const config = readFile(targetDir, 'astro.config.mjs');
    expect(config).toContain("import agentTale from '@agent-tale/astro-integration'");
    expect(config).toContain('agentTale(');
    expect(config).toContain("contentDir: './content'");
  });

  it('writes welcome post with correct title and wikilinks', () => {
    scaffold(targetDir, baseOptions);
    const welcome = readFile(targetDir, 'content', 'posts', 'welcome.md');
    expect(welcome).toContain('title: Welcome to Test Blog');
    expect(welcome).toContain('author: "Tester"');
    expect(welcome).toContain('[[wikilink]]');
    expect(welcome).toContain('[[about]]');
  });

  it('writes about post with author name', () => {
    scaffold(targetDir, baseOptions);
    const about = readFile(targetDir, 'content', 'posts', 'about.md');
    expect(about).toContain('title: About');
    expect(about).toContain('Written by Tester');
  });

  it('minimal template has no extra files', () => {
    scaffold(targetDir, baseOptions);
    expect(exists(targetDir, 'content', 'posts', 'start-here.md')).toBe(false);
    expect(exists(targetDir, '.mcp.json')).toBe(false);
  });

  it('garden template adds start-here.md', () => {
    scaffold(targetDir, { ...baseOptions, template: 'garden' });
    expect(exists(targetDir, 'content', 'posts', 'start-here.md')).toBe(true);
    const startHere = readFile(targetDir, 'content', 'posts', 'start-here.md');
    expect(startHere).toContain('[[digital-gardens|digital garden]]');
    expect(startHere).toContain('[[welcome]]');
  });

  it('agent template adds .mcp.json and mcp-server dependency', () => {
    scaffold(targetDir, { ...baseOptions, template: 'agent' });
    expect(exists(targetDir, '.mcp.json')).toBe(true);
    const mcp = JSON.parse(readFile(targetDir, '.mcp.json'));
    expect(mcp.mcpServers['agent-tale']).toBeDefined();
    const pkg = JSON.parse(readFile(targetDir, 'package.json'));
    expect(pkg.dependencies['@agent-tale/mcp-server']).toBeDefined();
  });

  it('gitignore includes expected patterns', () => {
    scaffold(targetDir, baseOptions);
    const gitignore = readFile(targetDir, '.gitignore');
    expect(gitignore).toContain('node_modules/');
    expect(gitignore).toContain('dist/');
    expect(gitignore).toContain('.astro/');
  });

  it('tsconfig extends astro strict', () => {
    scaffold(targetDir, baseOptions);
    const tsconfig = JSON.parse(readFile(targetDir, 'tsconfig.json'));
    expect(tsconfig.extends).toBe('astro/tsconfigs/strict');
  });
});
