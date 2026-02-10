import { ItemDetailListCellProps } from './types';

export const YearColumn = ({ song }: ItemDetailListCellProps) =>
    song.releaseYear ? String(song.releaseYear) : <>&nbsp;</>;
