#!/usr/bin/env node

import chalk from 'chalk';
import figlet from 'figlet';

import { createCommand } from './command';

const program = createCommand();
program
  .name('ado-cli')
  .version('0.0.1')
  .description(
    `${chalk.greenBright(
      figlet.textSync('ADO CLI', {
        horizontalLayout: 'full',
      }),
    )} \n Tools for working with Azure and Azure DevOps`,
  )
  .command('apim', 'Tools for working with Api Management.', {
    executableFile: './apim',
  })
  .command('devops', 'Tools for working Azure DevOps.', {
    executableFile: './devops/devops',
  });

program.parse(process.argv);
