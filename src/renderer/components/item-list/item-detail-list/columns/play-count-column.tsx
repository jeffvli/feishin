import { ItemDetailListCellProps } from './types';

export const PlayCountColumn = ({ song }: ItemDetailListCellProps) =>
    song.playCount ? String(song.playCount) : <>&nbsp;</>;
