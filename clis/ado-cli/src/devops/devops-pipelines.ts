#!/usr/bin/env node

import * as azdev from 'azure-devops-node-api';

import { createCommand } from '../command';

const program = createCommand();

program.name('apim').description('Tools for working with Api Management.');

const getAdoClient = (orgName: string): azdev.WebApi => {
  const orgUrl = `https://dev.azure.com/${orgName}`;

  const token: string = process.env
    .AZURE_DEVOPS_PERSONAL_ACCESS_TOKEN as string;

  const authHandler = azdev.getPersonalAccessTokenHandler(token);
  const connection = new azdev.WebApi(orgUrl, authHandler);
  return connection;
};

program
  .name('pipelines')
  .description('Tools for workign wiht Azure Devops Pipelines.')
  .command('list')
  .description('List all Azure Devops Pipelines')
  .action(async () => {
    const adoClient = getAdoClient('');
    const buildClient = await adoClient.getBuildApi();
    const definitions = await buildClient.getDefinitions('omnivet');
    console.log(definitions.map(d => d.name));
  });

program.parse(process.argv);
