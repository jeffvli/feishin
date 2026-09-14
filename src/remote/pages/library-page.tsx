import { useCallback, useMemo, useState } from 'react';

import { AlbumRow, AlbumRowSharedProps } from '/@/remote/components/album-row';
import { AlbumActionSheet } from '/@/remote/components/menus/album-action-sheet';
import { TrackActionSheet } from '/@/remote/components/menus/track-action-sheet';
import { TrackRow, TrackRowSharedProps } from '/@/remote/components/track-row';
import { VirtualRowList } from '/@/remote/components/virtual-row-list';
import { useConfirmedSend } from '/@/remote/hooks/use-confirmed-send';
import { useRemoteQuery } from '/@/remote/hooks/use-remote-query';
import { useAlbumsResponse, useTracksResponse } from '/@/remote/store/library';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { useDebouncedValue } from '/@/shared/hooks/use-debounced-value';
import { RemoteAlbumItem, RemoteTrackItem } from '/@/shared/types/remote-types';

type LibraryView = 'albums' | 'tracks';

export const LibraryPage = () => {
    const [view, setView] = useState<LibraryView>('tracks');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 300);
    const [activeTrack, setActiveTrack] = useState<null | RemoteTrackItem>(null);
    const [activeAlbum, setActiveAlbum] = useState<null | RemoteAlbumItem>(null);
    const confirmedSend = useConfirmedSend();
    const tracksResponse = useTracksResponse();
    const albumsResponse = useAlbumsResponse();

    // A single `useRemoteQuery` call, switching its `event`/`response` with
    // `view` rather than calling the hook once per view — the hook already
    // resets and refetches whenever `event` changes, so flipping the toggle
    // naturally issues exactly one fresh request for the newly selected type
    // instead of both views fetching in parallel on every mount.
    const { hasMore, isLoading, items, loadMore } = useRemoteQuery<
        RemoteAlbumItem | RemoteTrackItem
    >({
        event: view === 'tracks' ? 'tracks-request' : 'albums-request',
        response: view === 'tracks' ? tracksResponse : albumsResponse,
        searchTerm: debouncedSearchTerm || undefined,
    });

    const handleTrackPlay = useCallback(
        (track: RemoteTrackItem) => confirmedSend({ event: 'play-track', id: track.id }),
        [confirmedSend],
    );

    const handleAlbumPlay = useCallback(
        (album: RemoteAlbumItem) => confirmedSend({ event: 'play-album', id: album.id }),
        [confirmedSend],
    );

    const trackRowProps = useMemo<TrackRowSharedProps>(
        () => ({
            items: items as RemoteTrackItem[],
            onLongPress: setActiveTrack,
            onPlay: handleTrackPlay,
        }),
        [items, handleTrackPlay],
    );

    const albumRowProps = useMemo<AlbumRowSharedProps>(
        () => ({
            items: items as RemoteAlbumItem[],
            onLongPress: setActiveAlbum,
            onPlay: handleAlbumPlay,
        }),
        [items, handleAlbumPlay],
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flexShrink: 0,
                    gap: 'var(--theme-spacing-md)',
                    padding: 'var(--theme-spacing-md)',
                }}
            >
                <SegmentedControl
                    data={[
                        { label: 'Tracks', value: 'tracks' },
                        { label: 'Albums', value: 'albums' },
                    ]}
                    onChange={(value) => setView(value as LibraryView)}
                    value={view}
                />
                <TextInput
                    onChange={(e) => setSearchTerm(e.currentTarget.value)}
                    placeholder={view === 'tracks' ? 'Search tracks…' : 'Search albums…'}
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
                {view === 'tracks' ? (
                    <VirtualRowList<TrackRowSharedProps>
                        emptyMessage="No tracks found"
                        hasMore={hasMore}
                        isLoading={isLoading}
                        loadMore={loadMore}
                        resetKey={`tracks-${debouncedSearchTerm}`}
                        rowComponent={TrackRow}
                        rowCount={trackRowProps.items.length}
                        rowProps={trackRowProps}
                    />
                ) : (
                    <VirtualRowList<AlbumRowSharedProps>
                        emptyMessage="No albums found"
                        hasMore={hasMore}
                        isLoading={isLoading}
                        loadMore={loadMore}
                        resetKey={`albums-${debouncedSearchTerm}`}
                        rowComponent={AlbumRow}
                        rowCount={albumRowProps.items.length}
                        rowProps={albumRowProps}
                    />
                )}
            </div>
            <TrackActionSheet onClose={() => setActiveTrack(null)} track={activeTrack} />
            <AlbumActionSheet album={activeAlbum} onClose={() => setActiveAlbum(null)} />
        </div>
    );
};
