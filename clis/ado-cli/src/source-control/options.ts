import { Command, Option } from 'commander';

export const withPathToRoot = (command: Command): Command => {
  return command.option(
    '-p, --path-to-root <string>',
    'The path to the root of the local source control',
    '.',
  );
};

// export const withSourceControlTargetOption = (command: Command): Command => {
//   command.addOption(
//     new Option(
//       '-s, --source-control <string>',
//       'The source control as a service target to run against.',
//     )
//       .choices(['AzureDevOps'])
//       .default('AzureDevOps'),
//   );

//   return command;
// };

// export const withTargetOption = (command: Command): Command => {
//   command.addOption(
//     new Option('-t, --target <string>', 'The target.')
//       .choices(['local', 'remote'])
//       .default('local'),
//   );

//   return command;
// };
