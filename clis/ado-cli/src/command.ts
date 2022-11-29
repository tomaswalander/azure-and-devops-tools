import commander, { Option as _Option } from 'commander';

export const createCommand = () => {
  return new commander.Command();
};

export class Option extends _Option {}
