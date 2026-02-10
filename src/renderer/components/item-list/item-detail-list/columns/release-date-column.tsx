import { ItemDetailListCellProps } from './types';

import { formatDateAbsoluteUTC } from '/@/renderer/utils/format';

export const ReleaseDateColumn = ({ song }: ItemDetailListCellProps) =>
    song.releaseDate ? formatDateAbsoluteUTC(song.releaseDate) : <>&nbsp;</>;
