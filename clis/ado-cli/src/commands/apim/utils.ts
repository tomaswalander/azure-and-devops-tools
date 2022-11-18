import Joi, { ValidationError } from 'joi';
import { OpenAPIV2 } from 'openapi-types';

import { ApiConfig } from './types';

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

const checkOperationIdOnMethod = (
  operationIds: string[],
  pathItemObject: OpenAPIV2.PathItemObject,
  method: OpenAPIV2.HttpMethods,
): OpenAPIV2.OperationObject | undefined => {
  const operationId =
    pathItemObject && pathItemObject[method]
      ? pathItemObject[method]?.operationId
      : undefined;
  if (operationId && operationIds.includes(operationId)) {
    return pathItemObject[method];
  }
  return undefined;
};

export const filterOpenApiSpecByOperationIds = (
  openApiSpec: OpenAPIV2.Document,
  operationIds: null | string[],
): OpenAPIV2.Document => {
  if (!operationIds) {
    return openApiSpec;
  }
  const filteredOpenApiSpec: OpenAPIV2.Document = {
    ...openApiSpec,
    paths: Object.keys(openApiSpec.paths).reduce(
      (previous: OpenApiV2Paths, path: string) => {
        const pathItemObject = openApiSpec.paths[path];
        const filteredPathItemObject: OpenAPIV2.PathItemObject = {};
        methodsToCheck.forEach(method => {
          const result = checkOperationIdOnMethod(
            operationIds,
            pathItemObject,
            method,
          );
          if (result) {
            filteredPathItemObject[method] = result;
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

  return filteredOpenApiSpec;
};
