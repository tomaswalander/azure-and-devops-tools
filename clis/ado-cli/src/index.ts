#!/usr/bin/env node

import chalk from 'chalk';
import figlet from 'figlet';

import { createCommand } from './command';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageInfo = require('../package.json');

const program = createCommand();
program
  .name('ado-cli')
  .version('0.0.1')
  .description(
    `${chalk.greenBright(
      figlet.textSync('ADO CLI', {
        horizontalLayout: 'full',
      }),
    )}\n${chalk.cyan(`Version: ${packageInfo.version}`)} \n\n${
      packageInfo.description
    }`,
  )
  .command('apim', 'Tools for working with Api Management.', {
    executableFile: './apim',
  })
  .command('devops', 'Tools for working Azure DevOps.', {
    executableFile: './devops/devops',
  });

program.parse(process.argv);
