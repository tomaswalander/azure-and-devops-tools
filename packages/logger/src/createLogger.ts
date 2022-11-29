import logDriver, { Levels } from 'log-driver';

type LogFormatter = (
  level: Levels,
  msg: string,
  props: unknown,
  ...rest: unknown[]
) => string;

type LoggerMethod = (msg: string, props?: unknown) => void;

interface Logger {
  info: LoggerMethod;
  warn: LoggerMethod;
  err: LoggerMethod;
  debug: LoggerMethod;
  trace: LoggerMethod;
  breakline: (n?: number) => void;
}

let logger: Logger | undefined = undefined;
export const createLogger = (formatter: LogFormatter): Logger => {
  if (!logger) {
    const _logger = logDriver({
      format: formatter,
    });

    const trace = (msg: string, props?: unknown): void =>
      _logger.trace(msg, props);
    const info = (msg: string, props?: unknown): void =>
      _logger.info(msg, props);
    const warn = (msg: string, props?: unknown): void =>
      _logger.warn(msg, props);
    const err = (msg: string, props?: unknown): void =>
      _logger.error(msg, props);
    const debug = (msg: string, props?: unknown): void =>
      _logger.debug(msg, props);

    logger = {
      info,
      warn,
      err,
      debug,
      trace,
      breakline: (n = 1) => [...Array(n).keys()].forEach(() => console.log('')),
    };
  }

  return logger;
};
