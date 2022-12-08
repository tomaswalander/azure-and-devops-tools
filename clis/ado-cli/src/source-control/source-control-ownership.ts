#!/usr/bin/env node

import fs = require('fs/promises');

import { printResultsAsTable } from '@twalander-packages/cli-utils-print';
import { validateStringOrPrompt } from '@twalander-packages/cli-utils-prompt';
import commander, { Command } from 'commander';
import { glob as _glob, IOptions as GlobOptions } from 'glob';

import { withPathToRoot } from './options';

const program = new commander.Command();

program
  .name('ownership')
  .description('Manage ownership of folders in source control.');

type ListOptions = {
  pathToRoot?: string;
};

const glob = async (
  pattern: string,
  { root, ...rest }: { root?: string } & GlobOptions,
): Promise<string[]> => {
  const finalRoot = root ?? '';
  return new Promise((resolve, reject) => {
    return _glob(`${finalRoot}${pattern}`, rest, (err, files) => {
      if (err) {
        reject(err);
      }
      return resolve(files);
    });
  });
};

const readFileContentAsLines = async (path: string): Promise<string[]> => {
  const data = await fs.readFile(path, { encoding: 'utf8' });
  const owners = data.split(/\r?\n/);
  return owners.filter(o => !!o);
};

const findOwnersPerDirectory = async (
  pathToRoot: string,
): Promise<Record<string, string[]>> => {
  const ownerFiles = await glob(`/**/.owners`, { root: pathToRoot, dot: true });

  const ownersPerFile: Record<string, string[]> = {};
  await Promise.all(
    ownerFiles.map(async path => {
      const owners = await readFileContentAsLines(path);
      const folder = path
        .replace(/\/\.owners$/i, '')
        .replace(`${pathToRoot}/`, '');
      ownersPerFile[folder] = owners;
    }),
  );

  return ownersPerFile;
};

const listLocalOwners = async (opts: ListOptions) => {
  const pathToRoot = await validateStringOrPrompt(
    'What is the path to the root of the source control?',
    opts.pathToRoot,
    { isValid: v => !!v },
  );
  const ownersPerDirectory = await findOwnersPerDirectory(pathToRoot);
  printResultsAsTable(
    ['Folder', 'Owners'],
    Object.keys(ownersPerDirectory).map(folder => {
      return [folder, ownersPerDirectory[folder].join(', ')];
    }),
  );
};

const listRemoteOwners = async (opts: ListOptions) => {};

withPathToRoot(
  program
    .command('list')
    .description('List ownership per folder in source control.'),
).action(async (opts: ListOptions, command: Command): Promise<void> => {
  listRemoteOwners(opts);
});

program.parse(process.argv);
