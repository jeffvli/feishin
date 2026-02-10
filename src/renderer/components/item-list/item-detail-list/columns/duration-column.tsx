import formatDuration from 'format-duration';

import { ItemDetailListCellProps } from './types';

export const DurationColumn = ({ song }: ItemDetailListCellProps) => formatDuration(song.duration);
