import { ItemDetailListCellProps } from './types';

export const ReleaseYearColumn = ({ song }: ItemDetailListCellProps) =>
    song.releaseYear ? String(song.releaseYear) : <>&nbsp;</>;
