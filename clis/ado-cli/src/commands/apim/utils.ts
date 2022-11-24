import Joi, { ValidationError } from 'joi';
import { OpenAPIV2 } from 'openapi-types';

import { createLogger } from '../../logger';
import { ApiConfig } from './types';

const logger = createLogger();

type OpenApiV2Paths = OpenAPIV2.Document['paths'];

const methodsToCheck = [
  OpenAPIV2.HttpMethods.POST,
  OpenAPIV2.HttpMethods.GET,
  OpenAPIV2.HttpMethods.PATCH,
  OpenAPIV2.HttpMethods.PUT,
  OpenAPIV2.HttpMethods.DELETE,
  OpenAPIV2.HttpMethods.HEAD,
  OpenAPIV2.HttpMethods.OPTIONS,
];
const apiConfigSchema = Joi.array()
  .required()
  .items(
    Joi.object({
      displayName: Joi.string().required(),
      description: Joi.string().required(),
      path: Joi.string().required(),
      operations: Joi.array()
        .required()
        .min(1)
        .items(Joi.object({ id: Joi.string().required() }))
        .unique()
        .allow(null),
      name: Joi.string().required(),
      products: Joi.array().required().items(Joi.string()).unique(),
      parameters: Joi.any(), // cannot really validate all Azure Apim options
    }),
  )
  .unique('path')
  .unique('displayName')
  .unique('name');

export const validateApiConfigs = (
  config: ApiConfig[] | undefined,
): undefined | ValidationError => {
  const result = apiConfigSchema.validate(config);
  return result.error;
};

export const filterOpenApiSpecByOperationIds = (
  apiName: string,
  openApiSpec: OpenAPIV2.Document,
  requestedOperationIds: null | string[],
): OpenAPIV2.Document => {
  const openApiSpecAllOperationIds: string[] = [];
  if (!requestedOperationIds) {
    return openApiSpec;
  }
  const filteredOpenApiSpec: OpenAPIV2.Document = {
    ...openApiSpec,
    paths: Object.keys(openApiSpec.paths).reduce(
      (previous: OpenApiV2Paths, path: string) => {
        const pathItemObject = openApiSpec.paths[path];
        const filteredPathItemObject: OpenAPIV2.PathItemObject = {};
        methodsToCheck.forEach(method => {
          const operationId = pathItemObject[method]?.operationId;
          if (operationId) {
            openApiSpecAllOperationIds.push(operationId);
            if (requestedOperationIds.includes(operationId)) {
              filteredPathItemObject[method] = pathItemObject[method];
            } else {
              logger.info(
                `[${apiName}] SKIPPED: ${method.toLocaleUpperCase()} ${path} due to specified operation ids`,
              );
            }
          } else if (pathItemObject[method]) {
            logger.warn(
              `[${apiName}] Operation ${method.toLocaleUpperCase()} ${path} is missing the id property`,
            );
          } else {
            logger.debug(
              `[${apiName}] SKIPPED: ${method.toLocaleUpperCase()} ${path} due to method not allowed for path.`,
            );
          }
        });

        if (Object.keys(filteredPathItemObject).length > 0) {
          previous[path] = filteredPathItemObject;
        }

        return previous;
      },
      {} as OpenApiV2Paths,
    ),
  };

  const missingOperationIds = requestedOperationIds.filter(
    i => !openApiSpecAllOperationIds.includes(i),
  );
  if (missingOperationIds.length > 0) {
    logger.warn(
      `[${apiName}] At least one requested operation is not available in the OpenApi spec. If the missing operations are added in this release this should be safe to ignore.`,
      { missingOperationIds },
    );
  }

  return filteredOpenApiSpec;
};
