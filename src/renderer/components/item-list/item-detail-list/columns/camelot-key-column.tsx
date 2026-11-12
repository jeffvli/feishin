import { ItemDetailListCellProps } from './types';

import { CamelotKeyBadge } from '/@/renderer/features/key-detection/components/camelot-key-badge';
import { useSongCamelotKey } from '/@/renderer/features/key-detection/song-key-detection';

export const CamelotKeyColumn = ({ song }: ItemDetailListCellProps) => {
    const key = useSongCamelotKey(song);

    return key ? <CamelotKeyBadge camelotKey={key} /> : <>&nbsp;</>;
};
