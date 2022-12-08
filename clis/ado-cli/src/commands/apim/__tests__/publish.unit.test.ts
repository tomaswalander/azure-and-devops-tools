import fs from 'fs/promises';

import axios from 'axios';
import { Command } from 'commander';

import { validateOrPublishAction } from '../publish';

jest.mock('../../../logger', () => ({
  createLogger: jest.fn(() => ({
    debug: jest.fn(),
    err: jest.fn(),
    breakline: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  })),
}));
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));
jest.mock('axios', () => ({
  get: jest.fn(),
}));
const helpFn = jest.fn();
jest.mock('commander', () => ({
  Command: jest.fn(() => ({
    help: helpFn,
  })),
}));

const fsReadFile = fs.readFile as jest.Mock;
const axiosGet = axios.get as jest.Mock;

describe('commands > apim > validateOrPublishAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('mode=validate', () => {
    it('should abort if subscriptionId is not provided', async () => {
      await await validateOrPublishAction(
        {
          subscriptionId: undefined, // required value
          apiManagementName: 'test',
          resourceGroupName: 'test',
          mode: 'validate',
          apiConfigPath: 'path-to-api-config.json',
          url: 'https://func-omnv-test-domain-experimentations.azurewebsites.net/api/swagger.json',
        },
        new Command(),
      );
      expect(helpFn).toHaveBeenCalledTimes(1);
      expect(helpFn).toHaveBeenCalledWith({ error: true });
    });

    it('should abort if url is not provided', async () => {
      await validateOrPublishAction(
        {
          subscriptionId: '99ea8a35-eff4-454f-857d-de3b4c260431',
          apiManagementName: 'test',
          resourceGroupName: 'test',
          mode: 'validate',
          apiConfigPath: 'path-to-api-config.json',
          url: undefined, // required value
        },
        new Command(),
      );
      expect(helpFn).toHaveBeenCalledTimes(1);
      expect(helpFn).toHaveBeenCalledWith({ error: true });
    });

    it('should abort if api config is not provided', async () => {
      fsReadFile.mockReturnValueOnce('[]');
      axiosGet.mockReturnValueOnce({ data: 'test' });
      await validateOrPublishAction(
        {
          apiManagementName: 'test',
          resourceGroupName: 'test',
          mode: 'validate',
          apiConfigPath: undefined, // required
          subscriptionId: '6df6343c-f76b-468b-813c-0e14b8e24229',
          url: 'https://func-omnv-test-domain-experimentations.azurewebsites.net/api/swagger.json',
        },
        new Command(),
      );
      expect(helpFn).toHaveBeenCalledTimes(1);
      expect(helpFn).toHaveBeenCalledWith({ error: true });
    });

    it('should abort if api config is not a json file', async () => {
      fsReadFile.mockReturnValueOnce('[]');
      axiosGet.mockReturnValueOnce({ data: 'test' });
      await validateOrPublishAction(
        {
          apiManagementName: 'test',
          resourceGroupName: 'test',
          mode: 'validate',
          apiConfigPath: 'not-a-json-file.txt', // required
          subscriptionId: '6df6343c-f76b-468b-813c-0e14b8e24229',
          url: 'https://func-omnv-test-domain-experimentations.azurewebsites.net/api/swagger.json',
        },
        new Command(),
      );
      expect(helpFn).toHaveBeenCalledTimes(1);
      expect(helpFn).toHaveBeenCalledWith({ error: true });
    });

    it('should run through if passed options are valid', async () => {
      fsReadFile.mockReturnValueOnce('[]');
      axiosGet.mockReturnValueOnce({ data: 'test' });
      await validateOrPublishAction(
        {
          apiManagementName: 'test',
          resourceGroupName: 'test',
          mode: 'validate',
          apiConfigPath: 'path-to-api-config.json',
          subscriptionId: '6df6343c-f76b-468b-813c-0e14b8e24229',
          url: 'https://func-omnv-test-domain-experimentations.azurewebsites.net/api/swagger.json',
        },
        new Command(),
      );
      expect(helpFn).toHaveBeenCalledTimes(0);
    });
  });
});
