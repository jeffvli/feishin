import { ItemDetailListCellProps } from './types';

import { formatPartialIsoDateUTC } from '/@/renderer/utils/format';

export const DateColumn = ({ song }: ItemDetailListCellProps) =>
    song.date ? formatPartialIsoDateUTC(song.date) : <>&nbsp;</>;
