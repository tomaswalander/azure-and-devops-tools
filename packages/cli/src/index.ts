#!/usr/bin/env node

import chalk from 'chalk';
import commander from 'commander';
import figlet from 'figlet';

const program = new commander.Command();
program
  .name('ado-cli')
  .version('0.0.1')
  .description(
    `${chalk.greenBright(
      figlet.textSync('ADO CLI', {
        horizontalLayout: 'full',
      }),
    )} \n Tools for working with Azure and Azure DevOps`,
  );

program.parse(process.argv);
