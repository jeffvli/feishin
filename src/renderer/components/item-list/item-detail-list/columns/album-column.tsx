import { ItemDetailListCellProps } from './types';

export const AlbumColumn = ({ song }: ItemDetailListCellProps) => song.album ?? <>&nbsp;</>;
