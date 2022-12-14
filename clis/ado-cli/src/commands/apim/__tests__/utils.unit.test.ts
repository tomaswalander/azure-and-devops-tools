import {
  dropPrefixFromPaths,
  filterOpenApiSpecByOperationIds,
  hasDuplicatePathAfterPrefixDrop,
  pathSlashTrim,
  validateApiConfigs,
} from '../utils';

jest.mock('../../../logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    debug: jest.fn(),
    err: jest.fn(),
    breakline: jest.fn(),
  })),
}));

describe('utils', () => {
  describe('filterOpenApiSpecByOperationIds', () => {
    it('should return the spec as is if operationIds is null', () => {
      const result = filterOpenApiSpecByOperationIds(
        'test',
        openApiSpecExample,
        null,
      );
      expect(result).toStrictEqual(openApiSpecExample);
    });
    it('should return only the specified operation ids: ping and list-resources', () => {
      const result = filterOpenApiSpecByOperationIds(
        'test',
        openApiSpecExample,
        ['ping', 'list-resources'],
      );
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
      const result = filterOpenApiSpecByOperationIds(
        'test',
        openApiSpecExample,
        ['create-resource', 'list-resources'],
      );
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
      const result = filterOpenApiSpecByOperationIds(
        'test',
        openApiSpecExample,
        [
          'create-resource',
          'list-resources',
          'delete-resource',
          'update-resource',
        ],
      );
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
      const result = filterOpenApiSpecByOperationIds(
        'test',
        openApiSpecExample,
        ['health', 'create-resource', 'delete-resource', 'update-resource'],
      );
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
            operations: null,
            name: 'Name',
            products: [],
            parameters: undefined,
          },
          {
            displayName: 'Utilities API',
            description: 'This Api is for utilities of the App',
            path: 'path-2',
            serviceUrlSuffix: 'admin',
            dropRoutePrefix: undefined,
            operations: [{ id: 'ping' }, { id: 'health' }],
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
            operations: null,
            name: 'Name',
            products: [],
            parameters: undefined,
          },
          {
            displayName: 'Utilities API',
            description: 'This Api is for utilities of the App',
            path: 'path',
            operations: [{ id: 'ping' }, { id: 'health' }],
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
            operations: null,
            name: 'Name',
            products: [],
            parameters: undefined,
          },
          {
            displayName: 'Utilities API',
            description: 'This Api is for utilities of the App',
            path: 'path-2',
            operations: [{ id: 'ping' }, { id: 'health' }],
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
            operations: null,
            name: 'Name',
            products: [],
            parameters: undefined,
          },
          {
            displayName: 'Display',
            description: 'This Api is for utilities of the App',
            path: 'path-2',
            operations: [{ id: 'ping' }, { id: 'health' }],
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
            operations: [{ id: '1' }, { id: '1' }],
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
            operations: null,
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
            operations: null,
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
            operations: null,
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
          operations: null,
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
          operations: null,
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
      operations          | result
      ${null}             | ${true}
      ${undefined}        | ${false}
      ${''}               | ${false}
      ${[]}               | ${false}
      ${[{ id: 'item' }]} | ${true}
      ${[{ id: 1 }]}      | ${false}
    `(
      'it should return $result when operationIds is "$operationIds"',
      ({ operations, result }) => {
        const error = validateApiConfigs([
          {
            description: 'Description',
            displayName: 'Display',
            path: 'path',
            operations,
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
            operations: null,
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
    it.each`
      serviceUrlSuffix                                    | result
      ${null}                                             | ${false}
      ${''}                                               | ${false}
      ${[]}                                               | ${false}
      ${1}                                                | ${false}
      ${'/admin'}                                         | ${false}
      ${undefined}                                        | ${true}
      ${'admin'}                                          | ${true}
      ${'subset/api'}                                     | ${true}
      ${'suffix-with-hyphens/and-slashes-and-numbers/v1'} | ${true}
    `(
      'it should return $result when serviceUrlSuffix is "$serviceUrlSuffix"',
      ({ serviceUrlSuffix, result }) => {
        const error = validateApiConfigs([
          {
            description: 'Description',
            displayName: 'Display',
            path: 'path',
            serviceUrlSuffix,
            operations: null,
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
      dropRoutePrefix                                     | result
      ${null}                                             | ${false}
      ${[]}                                               | ${false}
      ${1}                                                | ${false}
      ${''}                                               | ${true}
      ${'/admin'}                                         | ${true}
      ${undefined}                                        | ${true}
      ${'admin'}                                          | ${true}
      ${'subset/api'}                                     | ${true}
      ${'suffix-with-hyphens/and-slashes-and-numbers/v1'} | ${true}
    `(
      'it should return $result when dropRoutePrefix is "$dropRoutePrefix"',
      ({ dropRoutePrefix, result }) => {
        const error = validateApiConfigs([
          {
            description: 'Description',
            displayName: 'Display',
            path: 'path',
            serviceUrlSuffix: 'admin',
            dropRoutePrefix,
            operations: null,
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
  });

  describe('pathSlashTrim', () => {
    it.each`
      subject        | result
      ${''}          | ${''}
      ${'/'}         | ${''}
      ${'//'}        | ${''}
      ${'abc'}       | ${'abc'}
      ${'/abc'}      | ${'abc'}
      ${'/abc/'}     | ${'abc'}
      ${'abc/'}      | ${'abc'}
      ${'abc-def'}   | ${'abc-def'}
      ${'abc/def'}   | ${'abc/def'}
      ${'/abc/def'}  | ${'abc/def'}
      ${'/abc/def/'} | ${'abc/def'}
      ${'abc/def/'}  | ${'abc/def'}
    `('It should return "$result" for "$subject"', ({ subject, result }) => {
      expect(pathSlashTrim(subject)).toBe(result);
    });
  });

  describe('hasDuplicatePathAfterPrefixDrop', () => {
    it.each`
      items                                   | prefix          | result
      ${[]}                                   | ${''}           | ${false}
      ${['a', 'b']}                           | ${''}           | ${false}
      ${['a', 'a']}                           | ${''}           | ${true}
      ${['before/a', 'before/b', 'before/c']} | ${'not-before'} | ${false}
      ${['before/a', 'before/b', 'before/c']} | ${'before'}     | ${false}
      ${['before/a', 'before/b', 'before/a']} | ${'before'}     | ${true}
      ${['a', 'a']}                           | ${''}           | ${true}
      ${['internal/a', 'a']}                  | ${'/internal'}  | ${true}
      ${['internal/a', 'a']}                  | ${'internal'}   | ${true}
      ${['internal/a', 'a']}                  | ${'internal/'}  | ${true}
      ${['internal/a', 'a']}                  | ${'/internal/'} | ${true}
      ${['/internal/a', '/a']}                | ${'/internal'}  | ${true}
      ${['/internal/a', '/a']}                | ${'internal'}   | ${true}
      ${['/internal/a', '/a']}                | ${'internal/'}  | ${true}
      ${['/internal/a', '/a']}                | ${'/internal/'} | ${true}
      ${['/internal/a/', '/a']}               | ${'/internal'}  | ${true}
      ${['/internal/a/', '/a']}               | ${'/internal'}  | ${true}
      ${['/internal/a/', '/a']}               | ${'internal'}   | ${true}
      ${['/internal/a/', '/a']}               | ${'internal'}   | ${true}
      ${['/internal/a', 'a']}                 | ${'internal/'}  | ${true}
      ${['/internal/a', 'a']}                 | ${'internal/'}  | ${true}
      ${['/internal/a', 'a']}                 | ${'/internal/'} | ${true}
      ${['/internal/a', 'a']}                 | ${'/internal/'} | ${true}
      ${['/internal/a/b/c/', 'a/b/c']}        | ${'internal/'}  | ${true}
      ${['/internal/a/b/c/', 'a/b/c']}        | ${'internal/'}  | ${true}
      ${['/internal/a/b/c/', 'a/b/c']}        | ${'/internal/'} | ${true}
      ${['/internal/a/b/c/', 'a/b/c']}        | ${'/internal/'} | ${true}
      ${['/internal/a/b/c/', 'ab/c']}         | ${'/internal/'} | ${false}
      ${['/internal/a/b/c/', 'abc']}          | ${'/internal/'} | ${false}
    `(
      'It should return $result when items are $items and prefix is "$prefix"',
      ({ items, prefix, result }) => {
        expect(hasDuplicatePathAfterPrefixDrop(items, prefix)).toBe(result);
      },
    );
  });

  describe('dropPrefixFromPaths', () => {
    it('should drop v1 from all paths', () => {
      const result = dropPrefixFromPaths(openApiSpecExample, 'v1');
      const paths = Object.keys(result.paths);
      expect(paths).toHaveLength(4);
      expect(paths).toContain('/ping');
      expect(paths).toContain('/health');
      expect(paths).toContain('/resources');
      expect(paths).toContain('/other-resources');
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
    '/v1/other-resources': {
      get: {
        tags: ['Resources'],
        operationId: 'list-other-resources',
        responses: {},
      },
      post: {
        tags: ['Resources'],
        operationId: 'create-other-resource',
        responses: {},
      },
      put: {
        tags: ['Resources'],
        operationId: 'update-other-resource',
        responses: {},
      },
      delete: {
        tags: ['Resources'],
        operationId: 'delete-other-resource',
        responses: {},
      },
    },
  },
};
