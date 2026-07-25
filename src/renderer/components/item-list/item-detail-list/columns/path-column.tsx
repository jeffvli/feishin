import { ItemDetailListCellProps } from './types';

import { resolveSongPath } from '/@/renderer/utils/resolve-song-path';

export const PathColumn = ({ song }: ItemDetailListCellProps) =>
    resolveSongPath(song.path) ?? <>&nbsp;</>;
