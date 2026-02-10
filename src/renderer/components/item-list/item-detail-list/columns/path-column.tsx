import { ItemDetailListCellProps } from './types';

export const PathColumn = ({ song }: ItemDetailListCellProps) => song.path ?? <>&nbsp;</>;
