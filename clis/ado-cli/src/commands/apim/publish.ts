import {
  ApiCreateOrUpdateParameter,
  ApiManagementClient,
} from '@azure/arm-apimanagement';
import {
  DefaultAzureCredential,
  ClientSecretCredential,
} from '@azure/identity';
import axios from 'axios';
import { Command, program } from 'commander';
import { OpenAPIV2 } from 'openapi-types';

import {
  ApiConfig,
  PublishToApimWithOperationIdFilterOptions,
  PublishToApimOptions,
} from './types';
import { filterOpenApiSpecByOperationIds, validateApiConfigs } from './utils';

const credential =
  process.env.TENANT_ID && process.env.CLIENT_ID && process.env.CLIENT_SECRET
    ? new ClientSecretCredential(
        process.env.TENANT_ID,
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
      )
    : new DefaultAzureCredential();

const _publishApiToApim = async ({
  subscriptionId,
  resourceGroupName,
  apiManagementName,
  name,
  displayName,
  path,
  products,
  openApiSpec,
  parameters,
}: PublishToApimOptions): Promise<void> => {
  const client = new ApiManagementClient(credential, subscriptionId);

  const finalParameters: ApiCreateOrUpdateParameter = {
    ...parameters,
    displayName,
    path,
    protocols: ['https'],
    format: 'openapi+json',
    value: JSON.stringify(openApiSpec),
  };

  await client.api.beginCreateOrUpdateAndWait(
    resourceGroupName,
    apiManagementName,
    name,
    finalParameters,
  );

  await Promise.all(
    products.map(p =>
      client.productApi.createOrUpdate(
        resourceGroupName,
        apiManagementName,
        p,
        name,
      ),
    ),
  );
};

export const publishApiFromSpec = async ({
  openApiSpec,
  operationIds,
  ...rest
}: PublishToApimWithOperationIdFilterOptions): Promise<void> => {
  _publishApiToApim({
    ...rest,
    openApiSpec: filterOpenApiSpecByOperationIds(openApiSpec, operationIds),
  });
};

type ApiOptions = {
  apiBasePath?: string;
  apiName?: string;
};

const getDefaultApiFromOpenApiSpec = (
  doc: OpenAPIV2.Document,
  opts: ApiOptions,
): ApiConfig => {
  if (!doc.info.description) {
    program.error(
      '\nFailed determining API description. Either provide a json-file containing api-config or the Open Api specification must contain a description.\n',
    );
  }
  return {
    displayName: doc.info.description,
    description: doc.info.description,
    name: opts.apiName ?? doc.info.title,
    path: opts.apiBasePath ?? doc.info.title.toLocaleLowerCase(),
    operationIds: null,
    products: [],
  };
};

/***********/
/* COMMAND */
/***********/

type PublishCommandOptions = ApiOptions & {
  url?: string;
  resourceGroupName: string;
  apiManagementName: string;
  subscriptionId?: string;
  apiConfigPath?: string;
  apply: boolean;
};

export const publishAction = async (
  {
    apiConfigPath,
    subscriptionId,
    url,
    apiBasePath,
    apiName,
    ...rest
  }: PublishCommandOptions,
  command: Command,
): Promise<void> => {
  if (!subscriptionId) {
    console.error(
      '\nAn Azure Subscription Id must be provided. See help below:\n',
    );
    command.help();
  }

  // fetch Open Api spec
  if (!url) {
    console.error(
      '\nAn Open Api Spec must be provided as a publicly available url. See help below\n',
    );
    command.help();
  }
  const result = await axios.get<OpenAPIV2.Document>(url);
  const openApiSpec = result.data;

  // validate api config
  let apiConfigsFromFile: ApiConfig[] | undefined = undefined;
  if (apiConfigPath && !apiConfigPath.endsWith('.json')) {
    console.error(
      '\nThe api-config, if provided, must be the path to a json file.\n',
    );
    command.help();
  } else if (apiConfigPath) {
    // TODO: validate file is according to expected spec
    try {
      apiConfigsFromFile = require(apiConfigPath);
      const error = validateApiConfigs(apiConfigsFromFile);
      if (error) {
        console.error(
          `\nApi Config at "${apiConfigPath}" is not valid. Message: '${error.message}'.\n`,
        );
        console.log('Details:', error);
        command.help();
      }
    } catch (err) {
      console.error(`\nFailed loading the api-config with error: ${err}.\n`);
      command.help();
    }
  } else {
    apiConfigsFromFile = [
      getDefaultApiFromOpenApiSpec(openApiSpec, { apiBasePath, apiName }),
    ];
    const error = validateApiConfigs(apiConfigsFromFile);
    if (error) {
      console.log(
        '\nNo Api Config given. Attempted to use given Open Api specification to generate an Api Config.\n',
      );
      console.error(
        `\nGenerated Api Config is not valid. Message '${error.message}'.\n`,
      );
      console.log('Details:', error);
      command.help();
    }
  }
  if (!apiConfigsFromFile) {
    // this shouldn't happen - apiConfig is always given a value and validated above - but to satisfy typescript
    console.error(
      `Failed determining Api Config. Please open an issue at: https://github.com/tomaswalander/azure-and-devops-tools/issues`,
    );
    command.help();
  }

  await Promise.all(
    apiConfigsFromFile.map(api =>
      publishApiFromSpec({
        ...rest,
        subscriptionId,
        openApiSpec: openApiSpec as OpenAPIV2.Document,
        ...api,
      }),
    ),
  );
};
