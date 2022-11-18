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
import { filterOpenApiSpecByOperationIds } from './utils';

const credential =
  process.env.TENANT_ID && process.env.CLIENT_ID && process.env.CLIENT_SECRET
    ? new ClientSecretCredential(
        process.env.TENANT_ID,
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
      )
    : new DefaultAzureCredential();

const logger = createLogger();

const _publishApiToApim = async ({
  subscriptionId,
  resourceGroupName,
  apiManagementName,
  name,
  displayName,
  path,
  products,
  openApiSpec,
  apply = false,
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

  if (apply) {
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
  } else {
    logger.info(
      'Would create the following API. Re-run with "--apply" to do it.',
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
      openApiSpec,
      operations?.map(({ id }) => id) ?? [],
    ),
  });
};
