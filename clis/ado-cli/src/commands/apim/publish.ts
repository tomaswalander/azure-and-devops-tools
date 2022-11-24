import fs from 'fs/promises';

import axios from 'axios';
import { Command } from 'commander';
import { OpenAPIV2 } from 'openapi-types';

import { createLogger } from '../../logger';
import { publishApiFromSpec } from './apim-utils';
import { ApiConfig } from './types';
import { validateApiConfigs } from './utils';

const logger = createLogger();

/***********/
/* COMMAND */
/***********/

export type ApimPublishCommandOptions = {
  mode: 'validate' | 'apply';
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

export const validateOrPublishAction = async (
  opts: ApimPublishCommandOptions,
  command: Command,
): Promise<void> => {
  logger.debug('Initialised with options', opts);
  const { mode, apiConfigPath, subscriptionId, url, ...rest } = opts;
  const shouldApply = mode === 'apply';

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

  const result = await axios.get<OpenAPIV2.Document>(url);
  const openApiSpec = result.data;
  logger.debug('Fetched OpenApi specification', {
    url,
    headers: result.headers,
    data: openApiSpec,
  });

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
  await Promise.all(
    apiConfigs.map(api =>
      publishApiFromSpec({
        ...rest,
        ...api,
        apply: shouldApply,
        subscriptionId,
        openApiSpec: openApiSpec as OpenAPIV2.Document,
      }),
    ),
  );
};
