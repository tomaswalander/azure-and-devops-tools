declare module 'log-driver' {
  export type Levels = 'error' | 'warn' | 'info' | 'debug' | 'trace';

  type Logger = {
    [key in Levels]: (msg: string, props?: unknown, ...rest: unknown[]) => void;
  };

  interface FactoryOptions {
    format?: (
      level: Levels,
      msg: string,
      props?: unknown,
      ...rest: unknown[]
    ) => string;
    level?: boolean;
  }
  function factory(options?: FactoryOptions): Logger;

  export = factory;
}
