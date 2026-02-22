import { ItemDetailListCellProps } from './types';

import { formatSizeString } from '/@/renderer/utils/format';

export const SizeColumn = ({ song }: ItemDetailListCellProps) =>
    song.size ? formatSizeString(song.size) : <>&nbsp;</>;
