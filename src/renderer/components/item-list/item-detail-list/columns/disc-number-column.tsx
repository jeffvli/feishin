import { ItemDetailListCellProps } from './types';

export const DiscNumberColumn = ({ song }: ItemDetailListCellProps) => String(song.discNumber ?? 1);
