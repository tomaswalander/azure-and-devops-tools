import chalk from 'chalk';
import logDriver, { Levels } from 'log-driver';

type SupportedPipelines = 'azure_pipelines';

const getLoggerMode = (): SupportedPipelines | 'interactive' | 'unknown' => {
  if (process.env.CI === 'azure_pipelines') {
    return 'azure_pipelines';
  } else if (process.env.CI) {
    return 'unknown';
  }
  return 'interactive';
};

const getAzurePipelinesPrefix = (level: Levels): string => {
  switch (level) {
    case 'debug':
      return '##[debug]';
    case 'warn':
      return '##[warning]';
    case 'error':
      return '##[error]';
    default:
      return '';
  }
};

const getInteractivePrefix = (level: Levels): string => {
  const text = ` ${level.toLocaleUpperCase()} `;
  switch (level) {
    case 'debug':
      return `${chalk.hex('#000').bgHex('#AAA').italic(text)}`;
    case 'warn':
      return `${chalk.hex('#000').bgHex('#F9E076').bold(text)}`;
    case 'error':
      return `${chalk.hex('#FAFAFA').bgHex('#D21404').bold(text)}`;
    case 'info':
      return `${chalk.hex('#000').bgHex('#55FFFF').bold(text)}`;
    default:
      return text;
  }
};

const getDefaultPrefix = (level: Levels): string => {
  return `[${level.toLocaleUpperCase()}] `;
};

const getPrefix = (level: Levels): string => {
  const mode = getLoggerMode();
  switch (mode) {
    case 'azure_pipelines':
      return getAzurePipelinesPrefix(level);
    case 'interactive':
      return getInteractivePrefix(level);
    default:
      return getDefaultPrefix(level);
  }
};
const getFormattedProps = (props?: unknown): string => {
  const spacer = getLoggerMode() === 'interactive' ? '\n\t' : '\t';
  return props && (!Array.isArray(props) || props.length > 0)
    ? `${spacer}${JSON.stringify(props)}`
    : '';
};

const formatMsg = (msg: string, level: Levels): string => {
  if (getLoggerMode() !== 'interactive') {
    return msg;
  }
  switch (level) {
    case 'debug':
      return `${chalk.hex('#AAA').italic(msg)} `;
    case 'warn':
      return `${chalk.hex('#F9E076')(msg)} `;
    case 'error':
      return `${chalk.hex('#D21404')(msg)} `;
    case 'info':
      return `${chalk.hex('#55FFFF')(msg)} `;
    default:
      return `${msg}`;
  }
};

const format = (
  level: Levels,
  msg: string,
  props: unknown,
  ...rest: unknown[]
) => {
  const spacer = getLoggerMode() === 'azure_pipelines' ? '' : '\t';
  return `${getPrefix(level)}${spacer}${formatMsg(
    msg,
    level,
  )}${getFormattedProps(props)}${getFormattedProps(rest)}`;
};

type LoggerMethod = (msg: string, props?: unknown) => void;

type Logger = {
  trace: LoggerMethod;
  info: LoggerMethod;
  warn: LoggerMethod;
  err: LoggerMethod;
  debug: LoggerMethod;
  breakline: (n?: number) => void;
};

let logger: Logger | undefined = undefined;

export const createLogger = (): Logger => {
  if (!logger) {
    console.log('initialising logger');
    const _logger = logDriver({
      format,
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
