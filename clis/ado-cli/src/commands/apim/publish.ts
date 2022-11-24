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

type PublishCommandOptions = {
  url?: string;
  resourceGroupName: string;
  apiManagementName: string;
  subscriptionId?: string;
  apiConfigPath?: string;
  apply: boolean;
};

const readApiConfig = async (path: string): Promise<ApiConfig[]> => {
  const content = await fs.readFile(path, { encoding: 'utf8' });
  logger.debug('Read api config', { path, content });

  return JSON.parse(content);
};

export const publishAction = async (
  opts: PublishCommandOptions,
  command: Command,
): Promise<void> => {
  logger.debug('Initialised with options', opts);
  const { apiConfigPath, subscriptionId, url, ...rest } = opts;

  const printErrorHelpAndExit = (msg: string, details?: unknown): never => {
    logger.breakline();
    logger.err(msg, details);
    logger.breakline();
    command.help({ error: true });
  };

  if (!subscriptionId) {
    return printErrorHelpAndExit('An Azure Subscription Id must be provided..');
  }
  // fetch Open Api spec
  if (!url) {
    return printErrorHelpAndExit(
      'An Open Api Spec must be provided as a publicly available url.',
    );
  }

  const result = await axios.get<OpenAPIV2.Document>(url);
  const openApiSpec = result.data;
  logger.debug('Fetched OpenApi specification', {
    url,
    headers: result.headers,
    data: openApiSpec,
  });

  // validate api config
  if (!apiConfigPath || !apiConfigPath.endsWith('.json')) {
    return printErrorHelpAndExit(
      'The api-config must be a path to a json file.',
    );
  }
  let apiConfigs: ApiConfig[] | undefined;
  try {
    apiConfigs = await readApiConfig(apiConfigPath);
  } catch (err) {
    return printErrorHelpAndExit(
      `Failed reading the api-config with error: ${err}.`,
    );
  }
  const error = validateApiConfigs(apiConfigs);
  if (error) {
    return printErrorHelpAndExit(
      `Api Config at "${apiConfigPath}" is not valid. Message: '${error.message}'.`,
      { error },
    );
  }
  await Promise.all(
    apiConfigs.map(api =>
      publishApiFromSpec({
        ...rest,
        subscriptionId,
        openApiSpec: openApiSpec as OpenAPIV2.Document,
        ...api,
      }),
    ),
  );
};
