import { ItemDetailListCellProps } from './types';

import { CamelotKeyBadge } from '/@/renderer/features/key-detection/components/camelot-key-badge';
import { getSongCamelotKey } from '/@/renderer/utils/camelot-key';

export const CamelotKeyColumn = ({ song }: ItemDetailListCellProps) => {
    const key = getSongCamelotKey(song);

    return key ? <CamelotKeyBadge camelotKey={key} /> : <>&nbsp;</>;
};
