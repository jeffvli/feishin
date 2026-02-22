import { ItemDetailListCellProps } from './types';

export const BpmColumn = ({ song }: ItemDetailListCellProps) => song.bpm ?? <>&nbsp;</>;
