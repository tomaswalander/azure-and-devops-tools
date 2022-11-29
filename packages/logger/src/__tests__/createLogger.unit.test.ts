import logDriver from 'log-driver';

import { createLogger } from '../createLogger';

const infoMock = jest.fn();
const errMock = jest.fn();
const warnMock = jest.fn();
const traceMock = jest.fn();
const debugMock = jest.fn();
jest.mock('log-driver', () =>
  jest.fn(() => ({
    info: infoMock,
    error: errMock,
    warn: warnMock,
    trace: traceMock,
    debug: debugMock,
  })),
);

const logDriverMock = logDriver as jest.Mock;

describe('createLogger', () => {
  it('should create a logger', () => {
    const logger = createLogger(jest.fn());
    expect(logDriverMock).toHaveBeenCalledTimes(1);
    expect(logDriverMock).toHaveBeenLastCalledWith({
      format: expect.any(Function),
    });
    expect(logger.err).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.info).toBeDefined();
    expect(logger.trace).toBeDefined();
    expect(logger.debug).toBeDefined();
    expect(logger.breakline).toBeDefined();
  });
  describe('logger', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it('should log info', () => {
      const logger = createLogger(jest.fn());
      logger.info('testing an info log');
      expect(infoMock).toHaveBeenCalledTimes(1);
      expect(infoMock).toHaveBeenCalledWith('testing an info log', undefined);
    });
    it('should log err', () => {
      const logger = createLogger(jest.fn());
      logger.err('testing an err log');
      expect(errMock).toHaveBeenCalledTimes(1);
      expect(errMock).toHaveBeenCalledWith('testing an err log', undefined);
    });
    it('should log warn', () => {
      const logger = createLogger(jest.fn());
      logger.warn('testing an warn log');
      expect(warnMock).toHaveBeenCalledTimes(1);
      expect(warnMock).toHaveBeenCalledWith('testing an warn log', undefined);
    });
    it('should log trace', () => {
      const logger = createLogger(jest.fn());
      logger.trace('testing an trace log');
      expect(traceMock).toHaveBeenCalledTimes(1);
      expect(traceMock).toHaveBeenCalledWith('testing an trace log', undefined);
    });
    it('should log debug', () => {
      const logger = createLogger(jest.fn());
      logger.debug('testing an debug log');
      expect(debugMock).toHaveBeenCalledTimes(1);
      expect(debugMock).toHaveBeenCalledWith('testing an debug log', undefined);
    });
  });
});
