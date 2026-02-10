import { ItemDetailListCellProps } from './types';

import { formatDateRelative } from '/@/renderer/utils/format';

export const LastPlayedColumn = ({ song }: ItemDetailListCellProps) =>
    song.lastPlayedAt ? formatDateRelative(song.lastPlayedAt) : <>&nbsp;</>;
