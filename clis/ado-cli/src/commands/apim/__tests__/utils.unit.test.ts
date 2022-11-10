import { filterOpenApiSpecByOperationIds } from '../utils';

describe('utils', () => {
  describe('filterOpenApiSpecByOperationIds', () => {
    it('should return only the specified operation ids: ping and list-resources', () => {
      const result = filterOpenApiSpecByOperationIds(openApiSpecExample, [
        'ping',
        'list-resources',
      ]);
      expect(result.paths['/ping'].get).toBeDefined();
      expect(result.paths['/health']).toBeUndefined();
      expect(result.paths['/v1/resources'].post).toBeUndefined();
      expect(result.paths['/v1/resources'].get).toBeDefined();
      expect(result.paths['/v1/resources'].put).toBeUndefined();
      expect(result.paths['/v1/resources'].delete).toBeUndefined();
      expect(Object.keys(result.paths)).toHaveLength(2);
      expect(result).toMatchSnapshot();
    });
    it('should return only the specified operation ids: create-resource and list-resources', () => {
      const result = filterOpenApiSpecByOperationIds(openApiSpecExample, [
        'create-resource',
        'list-resources',
      ]);
      expect(result.paths['/ping']).toBeUndefined();
      expect(result.paths['/health']).toBeUndefined();
      expect(result.paths['/v1/resources'].post).toBeDefined();
      expect(result.paths['/v1/resources'].get).toBeDefined();
      expect(result.paths['/v1/resources'].put).toBeUndefined();
      expect(result.paths['/v1/resources'].delete).toBeUndefined();
      expect(Object.keys(result.paths)).toHaveLength(1);
      expect(result).toMatchSnapshot();
    });
    it('should return only the specified operation ids: create-, list-, update- and delete-resource', () => {
      const result = filterOpenApiSpecByOperationIds(openApiSpecExample, [
        'create-resource',
        'list-resources',
        'delete-resource',
        'update-resource',
      ]);
      expect(result.paths['/ping']).toBeUndefined();
      expect(result.paths['/health']).toBeUndefined();
      expect(result.paths['/v1/resources'].post).toBeDefined();
      expect(result.paths['/v1/resources'].get).toBeDefined();
      expect(result.paths['/v1/resources'].put).toBeDefined();
      expect(result.paths['/v1/resources'].delete).toBeDefined();
      expect(Object.keys(result.paths)).toHaveLength(1);
      expect(result).toMatchSnapshot();
    });
    it('should return only the specified operation ids: health, create-, update- and delete-resource', () => {
      const result = filterOpenApiSpecByOperationIds(openApiSpecExample, [
        'health',
        'create-resource',
        'delete-resource',
        'update-resource',
      ]);
      expect(result.paths['/ping']).toBeUndefined();
      expect(result.paths['/health'].get).toBeDefined();
      expect(result.paths['/v1/resources'].post).toBeDefined();
      expect(result.paths['/v1/resources'].get).toBeUndefined();
      expect(result.paths['/v1/resources'].put).toBeDefined();
      expect(result.paths['/v1/resources'].delete).toBeDefined();
      expect(Object.keys(result.paths)).toHaveLength(2);
      expect(result).toMatchSnapshot();
    });
  });
});

const openApiSpecExample = {
  swagger: '2.0',
  info: {
    title: 'Experimentations',
    description: 'This is the OpenAPI Document on Azure Functions',
    version: '1.0.0',
  },
  host: 'func-omnv-test-domain-experimentations.azurewebsites.net',
  basePath: '/api',
  schemes: ['https'],
  paths: {
    '/ping': {
      get: {
        tags: ['Monitoring'],
        operationId: 'ping',
        responses: {},
      },
    },
    '/health': {
      get: {
        tags: ['Monitoring'],
        operationId: 'health',
        responses: {},
      },
    },
    '/v1/resources': {
      get: {
        tags: ['Resources'],
        operationId: 'list-resources',
        responses: {},
      },
      post: {
        tags: ['Resources'],
        operationId: 'create-resource',
        responses: {},
      },
      put: {
        tags: ['Resources'],
        operationId: 'update-resource',
        responses: {},
      },
      delete: {
        tags: ['Resources'],
        operationId: 'delete-resource',
        responses: {},
      },
    },
  },
};
