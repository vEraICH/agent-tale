import { text, select, isCancel, cancel } from '@clack/prompts';

export type Template = 'minimal' | 'garden' | 'agent';

export interface ProjectOptions {
  dir: string;
  title: string;
  author: string;
  template: Template;
}

function exitIfCancelled<T>(value: T | symbol): T {
  if (isCancel(value)) {
    cancel('Operation cancelled.');
    process.exit(0);
  }
  return value;
}

export async function runPrompts(dirArg?: string): Promise<ProjectOptions> {
  let dir: string;
  if (dirArg) {
    dir = dirArg;
  } else {
    dir = exitIfCancelled(
      await text({
        message: 'Project directory',
        placeholder: 'my-blog',
        validate: (v = '') => {
          if (!v.trim()) return 'Directory name is required';
          if (/[<>:"|?*]/.test(v)) return 'Invalid directory name';
          return undefined;
        },
      }),
    );
  }

  const title = exitIfCancelled(
    await text({
      message: 'Blog title',
      placeholder: dir.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      validate: (v = '') => (!v.trim() ? 'Title is required' : undefined),
    }),
  );

  const author = exitIfCancelled(
    await text({
      message: 'Author name',
      placeholder: 'Anonymous',
      defaultValue: 'Anonymous',
    }),
  );

  const template = exitIfCancelled(
    await select({
      message: 'Template',
      options: [
        { value: 'minimal' as const, label: 'Minimal', hint: 'clean blog with wikilinks' },
        { value: 'garden' as const, label: 'Garden', hint: 'digital garden with graph view' },
        { value: 'agent' as const, label: 'Agent', hint: 'MCP-ready agent journal' },
      ],
    }),
  );

  return { dir, title, author, template };
}
