#!/usr/bin/env node

import * as fs from 'node:fs';
import * as path from 'node:path';
import { runPrompts } from './prompts.js';
import { scaffold } from './scaffold.js';
import { intro, outro, log, spinner } from '@clack/prompts';
import pc from 'picocolors';

async function main(): Promise<void> {
  intro(pc.bold('create-agent-tale'));

  const dirArg = process.argv[2];

  const options = await runPrompts(dirArg);

  const s = spinner();
  s.start('Scaffolding your tale...');

  const targetDir = path.resolve(process.cwd(), options.dir);

  if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
    s.stop('Directory not empty');
    log.error(`${pc.red(targetDir)} already exists and is not empty.`);
    process.exit(1);
  }

  scaffold(targetDir, options);

  s.stop('Done!');

  log.success(pc.green('Project created.'));
  log.step('Next steps:');
  log.message([
    `  cd ${options.dir}`,
    '  pnpm install',
    '  pnpm dev',
  ].join('\n'));

  outro(pc.dim('Happy writing.'));
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
