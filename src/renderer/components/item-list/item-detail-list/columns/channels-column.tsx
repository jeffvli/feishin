import { ItemDetailListCellProps } from './types';

export const ChannelsColumn = ({ song }: ItemDetailListCellProps) =>
    song.channels != null ? String(song.channels) : <>&nbsp;</>;
