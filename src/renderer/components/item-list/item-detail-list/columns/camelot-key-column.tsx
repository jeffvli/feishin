import { ItemDetailListCellProps } from './types';

import { getSongCamelotKey } from '/@/renderer/utils/camelot-key';

export const CamelotKeyColumn = ({ song }: ItemDetailListCellProps) =>
    getSongCamelotKey(song) ?? <>&nbsp;</>;
