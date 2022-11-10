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

import { filterOpenApiSpecByOperationIds } from './utils';

const credential =
  process.env.TENANT_ID && process.env.CLIENT_ID && process.env.CLIENT_SECRET
    ? new ClientSecretCredential(
        process.env.TENANT_ID,
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
      )
    : new DefaultAzureCredential();

type NonChangeableProps = 'protocols' | 'format' | 'value';
type MandatoryProps = 'displayName' | 'description' | 'path';

type AdditionalParameters = Omit<
  ApiCreateOrUpdateParameter,
  NonChangeableProps | MandatoryProps
>;

interface PublishToApimOptions
  extends Required<Pick<ApiCreateOrUpdateParameter, MandatoryProps>> {
  subscriptionId: string;
  resourceGroupName: string;
  apiManagementName: string;

  name: string;
  openApiSpec: OpenAPIV2.Document;
  products: string[];

  parameters?: AdditionalParameters;
}

const _publishApiToApim = async (
  options: PublishToApimOptions,
): Promise<void> => {
  console.log(options);
  const {
    subscriptionId,
    resourceGroupName,
    apiManagementName,

    name,
    displayName,
    path,
    products,

    openApiSpec,

    parameters,
  } = options;

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

interface ApiConfigFromSpec extends PublishToApimOptions {
  operationIds: string[];
}

export const publishApiFromSpec = async ({
  openApiSpec,
  operationIds,
  ...rest
}: ApiConfigFromSpec): Promise<void> => {
  _publishApiToApim({
    ...rest,
    openApiSpec: filterOpenApiSpecByOperationIds(openApiSpec, operationIds),
  });
};

type GlobalProps = 'subscriptionId' | 'apiManagementName' | 'resourceGroupName';

type ApiConfig = Omit<ApiConfigFromSpec, 'openApiSpec' | GlobalProps>;

interface ApiOptions {
  apiBasePath?: string;
  apiName?: string;
}

interface PublishCommandOptions extends ApiOptions {
  url?: string;
  resourceGroupName: string;
  apiManagementName: string;
  subscriptionId?: string;
  apiConfigPath?: string;
}

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
    operationIds: [],
    products: [],
  };
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
  let apiConfigFromFile: ApiConfig[] | undefined = undefined;
  if (apiConfigPath && !apiConfigPath.endsWith('.json')) {
    program.error(
      '\nThe api-config, if provided, must be the path to a json file.\n',
    );
  } else if (apiConfigPath) {
    // TODO: validate file is according to expected spec
    try {
      apiConfigFromFile = require(apiConfigPath);
    } catch (err) {
      console.error(`\nFailed loading the api-config with error: ${err}.\n`);
      command.help();
    }
  }

  if (!subscriptionId) {
    console.error(
      '\nAn Azure Subscription Id must be provided. See help below:\n',
    );
    command.help();
  }

  let openApiSpec: OpenAPIV2.Document | undefined = undefined;
  if (url) {
    const result = await axios.get<OpenAPIV2.Document>(url);
    openApiSpec = result.data;
  }

  if (!openApiSpec) {
    console.error(
      '\nAn Open Api Spec must be provided as a publicly available url. See help below\n',
    );
    command.help();
  }

  const apiConfigsFromFile: ApiConfig[] | undefined = apiConfigPath
    ? apiConfigFromFile
    : undefined;
  const apiConfigs: ApiConfig[] = apiConfigsFromFile ?? [
    getDefaultApiFromOpenApiSpec(openApiSpec, { apiBasePath, apiName }),
  ];

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
