import Table from 'cli-table';

export const printResultsAsTable = (headers: string[], values: string[][]) => {
  const table = new Table({
    chars: {
      top: '',
      'top-mid': '',
      'top-left': '',
      'top-right': '',
      bottom: '',
      'bottom-mid': '',
      'bottom-left': '',
      'bottom-right': '',
      left: '',
      'left-mid': '',
      mid: '-',
      'mid-mid': '',
      right: '',
      'right-mid': '',
      middle: '',
    },
    head: headers,
  });
  values.forEach((r: string[]) => {
    table.push(r);
  });
  console.log(table.toString());
};
