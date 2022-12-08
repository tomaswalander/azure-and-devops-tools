#!/usr/bin/env node

import commander from 'commander';

const program = new commander.Command();

program.name('source-control').description('Tools for managing source control');

program.command('ownership', 'Manage ownership of folders in source control.');

program.parse(process.argv);
