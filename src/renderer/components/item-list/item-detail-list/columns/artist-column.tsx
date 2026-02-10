import { ItemDetailListCellProps } from './types';

import {
    JOINED_ARTISTS_MUTED_PROPS,
    JoinedArtists,
} from '/@/renderer/features/albums/components/joined-artists';

export const ArtistColumn = ({ isRowHovered, song }: ItemDetailListCellProps) => {
    const name = song.artistName?.trim() ?? '';
    const hasArtists = name.length > 0 || (song.artists?.length ?? 0) > 0;

    if (!hasArtists) return <>&nbsp;</>;

    return (
        <JoinedArtists
            artistName={song.artistName ?? ''}
            artists={song.artists ?? []}
            linkProps={JOINED_ARTISTS_MUTED_PROPS.linkProps}
            readOnly={!isRowHovered}
            rootTextProps={JOINED_ARTISTS_MUTED_PROPS.rootTextProps}
        />
    );
};
