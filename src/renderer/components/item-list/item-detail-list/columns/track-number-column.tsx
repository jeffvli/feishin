import { ItemDetailListCellProps } from './types';

export const TrackNumberColumn = ({ song }: ItemDetailListCellProps) => {
    const disc = song.discNumber ?? 1;
    const track = song.trackNumber.toString().padStart(2, '0');
    return `${disc}-${track}`;
};
