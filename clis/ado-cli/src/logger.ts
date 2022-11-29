import {
  createLogger as _createLogger,
  Levels,
} from '@twalander-packages/logger';
import chalk from 'chalk';

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

export const createLogger = (): ReturnType<typeof _createLogger> =>
  _createLogger(format);
