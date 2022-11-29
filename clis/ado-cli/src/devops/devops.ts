#!/usr/bin/env node

import { createCommand } from '../command';

const program = createCommand();

program.name('apim').description('Tools for working with Api Management.');

program
  .name('devops')
  .description('Tools for working Azure DevOps')
  .command('pipelines', 'Tools for managing Azure DevOps Pipelines', {
    executableFile: './devops-pipelines',
  });

program.parse(process.argv);
