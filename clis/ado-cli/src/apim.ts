#!/usr/bin/env node

import commander, { Option } from 'commander';

import { validateOrPublishAction } from './commands/apim/publish';
import { withApimInstanceOptions } from './options';

const program = new commander.Command();

program.name('apim').description('Tools for working with Api Management.');

withApimInstanceOptions(
  program
    .command('publish')
    .description(
      'Publish an Open Api specification as an Api Management Api. Optionally with filtering on operationIds and or granting access to pre-existing products.',
    ),
)
  .addOption(
    new Option('--mode <string>', 'Run in validate or apply mode.')
      .choices(['validate', 'apply'])
      .default('validate'),
  )
  .option(
    '-u, --url <string>',
    'A Url to a publicly accessible OpenApi specification to use',
  )
  .option(
    '-c, --api-config-path <string>',
    'A json-file containing api configuration for publishing multiple API:s for the same Open Api specification.',
  )
  .action(validateOrPublishAction);

program.parse(process.argv);
