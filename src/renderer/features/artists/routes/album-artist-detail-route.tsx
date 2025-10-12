import { useRef } from 'react';
import { useParams } from 'react-router';

import { NativeScrollArea } from '/@/renderer/components/native-scroll-area/native-scroll-area';
import { AlbumArtistDetailContent } from '/@/renderer/features/artists/components/album-artist-detail-content';
import { AlbumArtistDetailHeader } from '/@/renderer/features/artists/components/album-artist-detail-header';
import { useAlbumArtistDetail } from '/@/renderer/features/artists/queries/album-artist-detail-query';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { AnimatedPage, LibraryHeaderBar } from '/@/renderer/features/shared';
import { useFastAverageColor } from '/@/renderer/hooks';
import { useCurrentServer } from '/@/renderer/store';
import { useGeneralSettings, usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { LibraryItem } from '/@/shared/types/domain-types';

const AlbumArtistDetailRoute = () => {
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const server = useCurrentServer();
    const { artistBackground, artistBackgroundBlur } = useGeneralSettings();

    const { albumArtistId, artistId } = useParams() as {
        albumArtistId?: string;
        artistId?: string;
    };

    const routeId = (artistId || albumArtistId) as string;

    const handlePlayQueueAdd = usePlayQueueAdd();
    const playButtonBehavior = usePlayButtonBehavior();
    const detailQuery = useAlbumArtistDetail({
        query: { id: routeId },
        serverId: server?.id,
    });

    const { background: backgroundColor, colorId } = useFastAverageColor({
        id: artistId,
        src: detailQuery.data?.imageUrl,
        srcLoaded: !detailQuery.isLoading,
    });

    const backgroundUrl = detailQuery.data?.imageUrl || '';
    const background = (artistBackground && `url(${backgroundUrl})`) || backgroundColor;

    const handlePlay = () => {
        handlePlayQueueAdd?.({
            byItemType: {
                id: [routeId],
                type: LibraryItem.ALBUM_ARTIST,
            },
            playType: playButtonBehavior,
        });
    };

    return (
        <AnimatedPage key={`album-artist-detail-${routeId}`}>
            <NativeScrollArea
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
                ref={scrollAreaRef}
            >
                <AlbumArtistDetailHeader
                    background={{
                        background,
                        blur: (artistBackground && artistBackgroundBlur) || 0,
                        loading: !backgroundColor || colorId !== artistId,
                    }}
                    ref={headerRef}
                />
                <AlbumArtistDetailContent background={background} />
            </NativeScrollArea>
        </AnimatedPage>
    );
};

export default AlbumArtistDetailRoute;
