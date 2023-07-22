import { NativeScrollArea } from '/@/renderer/components';
import { AnimatedPage, LibraryHeaderBar } from '/@/renderer/features/shared';
import { useRef } from 'react';
import { useParams } from 'react-router';
import { useFastAverageColor } from '/@/renderer/hooks';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { LibraryItem } from '/@/renderer/api/types';
import { useAlbumArtistDetail } from '/@/renderer/features/artists/queries/album-artist-detail-query';
import { AlbumArtistDetailHeader } from '/@/renderer/features/artists/components/album-artist-detail-header';
import { AlbumArtistDetailContent } from '/@/renderer/features/artists/components/album-artist-detail-content';
import { useCurrentServer } from '/@/renderer/store';

const AlbumArtistDetailRoute = () => {
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const server = useCurrentServer();

    const { albumArtistId } = useParams() as { albumArtistId: string };
    const handlePlayQueueAdd = usePlayQueueAdd();
    const playButtonBehavior = usePlayButtonBehavior();
    const detailQuery = useAlbumArtistDetail({
        query: { id: albumArtistId },
        serverId: server?.id,
    });
    const background = useFastAverageColor(detailQuery.data?.imageUrl, !detailQuery.isLoading);

    const handlePlay = () => {
        handlePlayQueueAdd?.({
            byItemType: {
                id: [albumArtistId],
                type: LibraryItem.ALBUM_ARTIST,
            },
            playType: playButtonBehavior,
        });
    };

    if (detailQuery.isLoading || !background) return null;

    return (
        <AnimatedPage key={`album-artist-detail-${albumArtistId}`}>
            <NativeScrollArea
                ref={scrollAreaRef}
                pageHeaderProps={{
                    backgroundColor: background,
                    children: (
                        <LibraryHeaderBar>
                            <LibraryHeaderBar.PlayButton onClick={handlePlay} />
                            <LibraryHeaderBar.Title>
                                {detailQuery?.data?.name}
                            </LibraryHeaderBar.Title>
                        </LibraryHeaderBar>
                    ),
                    offset: 200,
                    target: headerRef,
                }}
            >
                <AlbumArtistDetailHeader
                    ref={headerRef}
                    background={background}
                />
                <AlbumArtistDetailContent background={background} />
            </NativeScrollArea>
        </AnimatedPage>
    );
};

export default AlbumArtistDetailRoute;
