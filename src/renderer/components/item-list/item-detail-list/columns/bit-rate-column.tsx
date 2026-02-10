import { ItemDetailListCellProps } from './types';

export const BitRateColumn = ({ song }: ItemDetailListCellProps) =>
    song.bitRate != null ? `${song.bitRate} kbps` : <>&nbsp;</>;
