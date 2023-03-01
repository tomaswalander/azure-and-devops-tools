#!/usr/bin/env node

import chalk from 'chalk';
import commander from 'commander';
import figlet from 'figlet';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageInfo = require('../package.json');

const program = new commander.Command();
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
  });

program.parse(process.argv);
