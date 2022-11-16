import { filterOpenApiSpecByOperationIds, validateApiConfigs } from '../utils';

describe('utils', () => {
  describe('filterOpenApiSpecByOperationIds', () => {
    it('should return the spec as is if operationIds is null', () => {
      const result = filterOpenApiSpecByOperationIds(openApiSpecExample, null);
      expect(result).toStrictEqual(openApiSpecExample);
    });
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
  describe('validateApiConfig', () => {
    it('should return true for valid config', () => {
      expect(
        validateApiConfigs([
          {
            displayName: 'Display',
            description: 'Description',
            path: 'path',
            operationIds: null,
            name: 'Name',
            products: [],
            parameters: undefined,
          },
          {
            displayName: 'Utilities API',
            description: 'This Api is for utilities of the App',
            path: 'path-2',
            operationIds: ['ping', 'health'],
            name: 'Name 2',
            products: ['utilities'],
            parameters: undefined,
          },
        ]),
      ).toBeUndefined();
    });
    it('should disallow path from having duplicate values', () => {
      expect(
        validateApiConfigs([
          {
            displayName: 'Display',
            description: 'Description',
            path: 'path',
            operationIds: null,
            name: 'Name',
            products: [],
            parameters: undefined,
          },
          {
            displayName: 'Utilities API',
            description: 'This Api is for utilities of the App',
            path: 'path',
            operationIds: ['ping', 'health'],
            name: 'Name 2',
            products: ['utilities'],
            parameters: undefined,
          },
        ]),
      ).toBeDefined();
    });
    it('should disallow name from having duplicate values', () => {
      expect(
        validateApiConfigs([
          {
            displayName: 'Display',
            description: 'Description',
            path: 'path',
            operationIds: null,
            name: 'Name',
            products: [],
            parameters: undefined,
          },
          {
            displayName: 'Utilities API',
            description: 'This Api is for utilities of the App',
            path: 'path-2',
            operationIds: ['ping', 'health'],
            name: 'Name',
            products: ['utilities'],
            parameters: undefined,
          },
        ]),
      ).toBeDefined();
    });
    it('should disallow displayName from having duplicate values', () => {
      expect(
        validateApiConfigs([
          {
            displayName: 'Display',
            description: 'Description',
            path: 'path',
            operationIds: null,
            name: 'Name',
            products: [],
            parameters: undefined,
          },
          {
            displayName: 'Display',
            description: 'This Api is for utilities of the App',
            path: 'path-2',
            operationIds: ['ping', 'health'],
            name: 'Name 2',
            products: ['utilities'],
            parameters: undefined,
          },
        ]),
      ).toBeDefined();
    });
    it('should disallow operationIds from having duplicate values', () => {
      expect(
        validateApiConfigs([
          {
            displayName: 'Display',
            description: 'Description',
            path: 'path',
            operationIds: ['1', '1'],
            name: 'Name',
            products: [],
            parameters: undefined,
          },
        ]),
      ).toBeDefined();
    });
    it('should disallow products from having duplicate values', () => {
      expect(
        validateApiConfigs([
          {
            displayName: 'Display',
            description: 'Description',
            path: 'path',
            operationIds: null,
            name: 'Name',
            products: ['1', '1'],
            parameters: undefined,
          },
        ]),
      ).toBeDefined();
    });
    it.each`
      displayName  | result
      ${null}      | ${false}
      ${undefined} | ${false}
      ${''}        | ${false}
      ${'Display'} | ${true}
    `(
      'it should return $result when displayName is "$displayName"',
      ({ displayName, result }) => {
        const error = validateApiConfigs([
          {
            displayName,
            description: 'Description',
            path: 'path',
            operationIds: null,
            name: 'Name',
            products: [],
            parameters: undefined,
          },
        ]);
        if (result) {
          expect(error).toBeUndefined();
        } else {
          expect(error).toBeDefined();
        }
      },
    );
    it.each`
      description  | result
      ${null}      | ${false}
      ${undefined} | ${false}
      ${''}        | ${false}
      ${'Display'} | ${true}
    `(
      'it should return $result when description is "$description"',
      ({ description, result }) => {
        const error = validateApiConfigs([
          {
            description,
            displayName: 'Display',
            path: 'path',
            operationIds: null,
            name: 'Name',
            products: [],
            parameters: undefined,
          },
        ]);
        if (result) {
          expect(error).toBeUndefined();
        } else {
          expect(error).toBeDefined();
        }
      },
    );
    it.each`
      name         | result
      ${null}      | ${false}
      ${undefined} | ${false}
      ${''}        | ${false}
      ${'Display'} | ${true}
    `('it should return $result when name is "$name"', ({ name, result }) => {
      const error = validateApiConfigs([
        {
          description: 'Description',
          displayName: 'Display',
          path: 'path',
          operationIds: null,
          name,
          products: [],
          parameters: undefined,
        },
      ]);
      if (result) {
        expect(error).toBeUndefined();
      } else {
        expect(error).toBeDefined();
      }
    });
    it.each`
      path         | result
      ${null}      | ${false}
      ${undefined} | ${false}
      ${''}        | ${false}
      ${'Display'} | ${true}
    `('it should return $result when path is "$path"', ({ path, result }) => {
      const error = validateApiConfigs([
        {
          description: 'Description',
          displayName: 'Display',
          path,
          operationIds: null,
          name: 'Name',
          products: [],
          parameters: undefined,
        },
      ]);
      if (result) {
        expect(error).toBeUndefined();
      } else {
        expect(error).toBeDefined();
      }
    });
    it.each`
      operationIds | result
      ${null}      | ${true}
      ${undefined} | ${false}
      ${''}        | ${false}
      ${[]}        | ${false}
      ${['item']}  | ${true}
      ${[1]}       | ${false}
    `(
      'it should return $result when operationIds is "$operationIds"',
      ({ operationIds, result }) => {
        const error = validateApiConfigs([
          {
            description: 'Description',
            displayName: 'Display',
            path: 'path',
            operationIds,
            name: 'Name',
            products: [],
            parameters: undefined,
          },
        ]);
        if (result) {
          expect(error).toBeUndefined();
        } else {
          expect(error).toBeDefined();
        }
      },
    );
    it.each`
      products       | result
      ${null}        | ${false}
      ${undefined}   | ${false}
      ${''}          | ${false}
      ${[]}          | ${true}
      ${['product']} | ${true}
      ${[1]}         | ${false}
    `(
      'it should return $result when products is "$products"',
      ({ products, result }) => {
        const error = validateApiConfigs([
          {
            description: 'Description',
            displayName: 'Display',
            path: 'path',
            operationIds: null,
            name: 'Name',
            products,
            parameters: undefined,
          },
        ]);
        if (result) {
          expect(error).toBeUndefined();
        } else {
          expect(error).toBeDefined();
        }
      },
    );
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
