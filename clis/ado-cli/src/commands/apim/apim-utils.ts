// TODO move to package - kept here for simplicity
import {
  ApiCreateOrUpdateParameter,
  ApiManagementClient,
} from '@azure/arm-apimanagement';
import {
  ClientSecretCredential,
  DefaultAzureCredential,
} from '@azure/identity';

import { createLogger } from '../../logger';
import {
  PublishToApimOptions,
  PublishToApimWithOperationIdFilterOptions,
} from './types';
import {
  dropPrefixFromPaths,
  filterOpenApiSpecByOperationIds,
  hasDuplicatePathAfterPrefixDrop,
  pathSlashTrim,
} from './utils';

const credential =
  process.env.TENANT_ID && process.env.CLIENT_ID && process.env.CLIENT_SECRET
    ? new ClientSecretCredential(
        process.env.TENANT_ID,
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
      )
    : new DefaultAzureCredential();

const logger = createLogger();

const getServiceUrl = (
  host: string,
  ...pathFragments: Array<string | undefined>
): string => {
  if (!host.startsWith('https://')) {
    host = `https://${host}`;
  }
  return pathFragments.reduce((prev, curr) => {
    if (!curr) {
      return prev;
    }
    curr = pathSlashTrim(curr);
    return `${prev}/${curr}`;
  }, host) as string;
};

const _publishApiToApim = async ({
  subscriptionId,
  resourceGroupName,
  apiManagementName,
  name,
  displayName,
  path,
  serviceUrlSuffix,
  dropRoutePrefix,
  products,
  openApiSpec,
  apply = false,
  parameters,
}: PublishToApimOptions): Promise<void> => {
  const slashSafeDropRoutePrefix: string | undefined =
    dropRoutePrefix && !dropRoutePrefix.startsWith('/')
      ? `/${dropRoutePrefix}`
      : dropRoutePrefix;

  if (slashSafeDropRoutePrefix) {
    const hasDuplicatePath = hasDuplicatePathAfterPrefixDrop(
      Object.keys(openApiSpec.paths),
      slashSafeDropRoutePrefix,
    );
    if (hasDuplicatePath) {
      logger.err(
        `After dropging route prefix "${dropRoutePrefix}" from provided operations at least one duplicate path exists for API with name "${name}".`,
        {
          allPathsBeforeDroppingPrefix: Object.keys(openApiSpec.paths),
          dropRoutePrefix,
        },
      );
      process.exit(1);
    }
    openApiSpec = dropPrefixFromPaths(openApiSpec, slashSafeDropRoutePrefix);
  }

  const client = new ApiManagementClient(credential, subscriptionId);

  const serviceUrl = getServiceUrl(
    openApiSpec.host,
    openApiSpec.basePath,
    serviceUrlSuffix,
  );

  const finalParameters: ApiCreateOrUpdateParameter = {
    ...parameters,
    displayName,
    path,
    protocols: ['https'],
    format: 'openapi+json',
    serviceUrl,
    value: JSON.stringify(openApiSpec),
  };

  if (apply) {
    await client.api.beginCreateOrUpdateAndWait(
      resourceGroupName,
      apiManagementName,
      name,
      finalParameters,
    );

    const productsAlreadyInApi = await client.apiProduct.listByApis(
      resourceGroupName,
      apiManagementName,
      name,
    );
    const productsToDelete: string[] = [];
    for await (const p of productsAlreadyInApi) {
      if (p.name && !products.includes(p.name)) {
        productsToDelete.push(p.name);
      }
    }
    await Promise.all(
      productsToDelete.map(p =>
        client.productApi
          .delete(resourceGroupName, apiManagementName, p, name)
          .catch(err => {
            logger.err(
              `Failed to delete product ${p} from api ${name} in ApiM ${apiManagementName} and resource group ${resourceGroupName} with message "${err.message}"`,
            );
            logger.info(
              `Rerun this script to retry OR remove it manually from Azure Portal.`,
            );
            return Promise.resolve();
          }),
      ),
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
  } else {
    logger.info(
      'Would create the following API. Re-run with "--mode=apply" to do it.',
      {
        input: {
          subscriptionId,
          resourceGroupName,
          apiManagementName,
          name,
          displayName,
          path,
          products,
          openApiSpec,
          parameters,
        },
        output: finalParameters,
      },
    );
  }
};

export const publishApiFromSpec = async ({
  openApiSpec,
  operations,
  ...rest
}: PublishToApimWithOperationIdFilterOptions): Promise<void> => {
  _publishApiToApim({
    ...rest,
    openApiSpec: filterOpenApiSpecByOperationIds(
      rest.name,
      openApiSpec,
      operations?.map(({ id }) => id) ?? [],
    ),
  });
};
