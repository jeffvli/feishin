import { ItemDetailListCellProps } from './types';

export const CodecColumn = ({ song }: ItemDetailListCellProps) => song.container ?? <>&nbsp;</>;
