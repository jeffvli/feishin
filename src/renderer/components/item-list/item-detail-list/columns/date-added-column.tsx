import { ItemDetailListCellProps } from './types';

import { formatDateAbsolute } from '/@/renderer/utils/format';

export const DateAddedColumn = ({ song }: ItemDetailListCellProps) =>
    song.createdAt ? formatDateAbsolute(song.createdAt) : <>&nbsp;</>;
