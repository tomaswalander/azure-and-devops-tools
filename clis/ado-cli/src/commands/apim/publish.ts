import fs from 'fs/promises';

import axios from 'axios';
import { Command } from 'commander';

import { createLogger } from '../../logger';
import { publishApiFromSpec } from './apim-utils';
import { ApiConfig, OpenApiSpec } from './types';
import { validateApiConfigs } from './utils';

const logger = createLogger();

/***********/
/* COMMAND */
/***********/

export type ApimPublishCommandOptions = {
  url?: string;
  resourceGroupName: string;
  apiManagementName: string;
  subscriptionId?: string;
  apiConfigPath?: string;
};

const readApiConfig = async (path: string): Promise<ApiConfig[]> => {
  const content = await fs.readFile(path, { encoding: 'utf8' });
  logger.debug('Read api config', { path, content });

  return JSON.parse(content);
};

export const validateAction = async (
  opts: ApimPublishCommandOptions,
  command: Command,
): Promise<void> => {
  logger.debug('Initialised with options', opts);
  const { apiConfigPath, subscriptionId, url } = opts;

  const printError = (msg: string, details?: unknown) => {
    logger.breakline();
    logger.err(msg, details);
    logger.breakline();
    command.help({ error: true });
  };

  if (!subscriptionId) {
    printError('An Azure Subscription Id must be provided.');
    return;
  }
  if (!url) {
    printError(
      'An Open Api Spec must be provided as a publicly available url.',
    );
    return;
  }
  if (!apiConfigPath || !apiConfigPath.endsWith('.json')) {
    printError('The api-config must be a path to a json file.');
    return;
  }

  let apiConfigs: ApiConfig[] | undefined;
  try {
    apiConfigs = await readApiConfig(apiConfigPath);
  } catch (err) {
    return printError(`Failed reading the api-config with error: ${err}.`);
  }
  const error = validateApiConfigs(apiConfigs);
  if (error) {
    return printError(
      `Api Config at "${apiConfigPath}" is not valid. Message: '${error.message}'.`,
      { error },
    );
  }
  // TODO figure out how to validate more stuff - but reliably
  // I.e., what to do if it's not possible to fetch the openapi spec at this point
  logger.info(`Looks ok to me!`);
  logger.warn(`Currently the script is only validating the api-config file.`);
};

export const publishAction = async (
  opts: ApimPublishCommandOptions,
  command: Command,
): Promise<void> => {
  logger.debug('Initialised with options', opts);
  const { apiConfigPath, subscriptionId, url, ...rest } = opts;

  const printError = (msg: string, details?: unknown) => {
    logger.breakline();
    logger.err(msg, details);
    logger.breakline();
    command.help({ error: true });
  };

  if (!subscriptionId) {
    printError('An Azure Subscription Id must be provided.');
    return;
  }
  if (!url) {
    printError(
      'An Open Api Spec must be provided as a publicly available url.',
    );
    return;
  }
  if (!apiConfigPath || !apiConfigPath.endsWith('.json')) {
    printError('The api-config must be a path to a json file.');
    return;
  }

  let apiConfigs: ApiConfig[] | undefined;
  try {
    apiConfigs = await readApiConfig(apiConfigPath);
  } catch (err) {
    return printError(`Failed reading the api-config with error: ${err}.`);
  }
  const error = validateApiConfigs(apiConfigs);
  if (error) {
    return printError(
      `Api Config at "${apiConfigPath}" is not valid. Message: '${error.message}'.`,
      { error },
    );
  }

  let openApiSpec: OpenApiSpec | undefined;
  try {
    const result = await axios.get<OpenApiSpec>(url);
    openApiSpec = result.data;
    logger.debug('Fetched OpenApi specification', {
      url,
      headers: result.headers,
      data: openApiSpec,
    });
  } catch (err: unknown) {
    printError(
      `Failed fetching the OpenApi spec. Please ensure the open api spec is a publicly available url.`,
      { err, url },
    );
  }

  await Promise.all(
    apiConfigs.map(api =>
      publishApiFromSpec({
        ...rest,
        ...api,
        apply: true,
        subscriptionId,
        openApiSpec: openApiSpec as OpenApiSpec,
      }),
    ),
  );
};

export const validateOrPublishAction = async (
  opts: ApimPublishCommandOptions & { mode: 'validate' | 'apply' },
  command: Command,
): Promise<void> =>
  opts.mode === 'apply'
    ? publishAction(opts, command)
    : validateAction(opts, command);
