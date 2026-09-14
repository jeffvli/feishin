import { useCallback, useMemo, useState } from 'react';

import { PlaylistActionSheet } from '/@/remote/components/menus/playlist-action-sheet';
import { PlaylistRow, PlaylistRowSharedProps } from '/@/remote/components/playlist-row';
import { VirtualRowList } from '/@/remote/components/virtual-row-list';
import { useConfirmedSend } from '/@/remote/hooks/use-confirmed-send';
import { useRemoteQuery } from '/@/remote/hooks/use-remote-query';
import { usePlaylistsResponse } from '/@/remote/store/library';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { useDebouncedValue } from '/@/shared/hooks/use-debounced-value';
import { RemotePlaylistItem } from '/@/shared/types/remote-types';

export const PlaylistsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 300);
    const [activePlaylist, setActivePlaylist] = useState<null | RemotePlaylistItem>(null);
    const confirmedSend = useConfirmedSend();
    const response = usePlaylistsResponse();

    const { hasMore, isLoading, items, loadMore } = useRemoteQuery<RemotePlaylistItem>({
        event: 'playlists-request',
        response,
        searchTerm: debouncedSearchTerm || undefined,
    });

    const handlePlay = useCallback(
        (playlist: RemotePlaylistItem) =>
            confirmedSend({ event: 'play-playlist', id: playlist.id }),
        [confirmedSend],
    );

    const rowProps = useMemo<PlaylistRowSharedProps>(
        () => ({ items, onLongPress: setActivePlaylist, onPlay: handlePlay }),
        [items, handlePlay],
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flexShrink: 0, padding: 'var(--theme-spacing-md)' }}>
                <TextInput
                    onChange={(e) => setSearchTerm(e.currentTarget.value)}
                    placeholder="Search playlists…"
                    value={searchTerm}
                />
            </div>
            <div
                style={{
                    display: 'flex',
                    flex: 1,
                    flexDirection: 'column',
                    minHeight: 0,
                    padding: '0 var(--theme-spacing-md) var(--theme-spacing-md)',
                }}
            >
                <VirtualRowList<PlaylistRowSharedProps>
                    emptyMessage="No playlists found"
                    hasMore={hasMore}
                    isLoading={isLoading}
                    loadMore={loadMore}
                    resetKey={debouncedSearchTerm ?? ''}
                    rowComponent={PlaylistRow}
                    rowCount={rowProps.items.length}
                    rowProps={rowProps}
                />
            </div>
            <PlaylistActionSheet
                onClose={() => setActivePlaylist(null)}
                playlist={activePlaylist}
            />
        </div>
    );
};
