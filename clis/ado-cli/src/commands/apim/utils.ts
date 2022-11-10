import { OpenAPIV2 } from 'openapi-types';

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
  operationIds: string[],
): OpenAPIV2.Document => {
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
