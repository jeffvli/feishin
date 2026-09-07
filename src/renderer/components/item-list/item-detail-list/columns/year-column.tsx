import { ItemDetailListCellProps } from './types';

export const YearColumn = ({ song }: ItemDetailListCellProps) =>
    song.year ? String(song.year) : <>&nbsp;</>;
