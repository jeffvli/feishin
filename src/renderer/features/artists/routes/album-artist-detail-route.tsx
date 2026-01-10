import { useSuspenseQueries } from '@tanstack/react-query';
import { Suspense, useRef } from 'react';
import { useParams } from 'react-router';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { NativeScrollArea } from '/@/renderer/components/native-scroll-area/native-scroll-area';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import { AlbumArtistDetailContent } from '/@/renderer/features/artists/components/album-artist-detail-content';
import { AlbumArtistDetailHeader } from '/@/renderer/features/artists/components/album-artist-detail-header';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import {
    LibraryBackgroundImage,
    LibraryBackgroundOverlay,
} from '/@/renderer/features/shared/components/library-background-overlay';
import { LibraryContainer } from '/@/renderer/features/shared/components/library-container';
import { LibraryHeaderBar } from '/@/renderer/features/shared/components/library-header-bar';
import { PageErrorBoundary } from '/@/renderer/features/shared/components/page-error-boundary';
import { useFastAverageColor, useWaitForColorCalculation } from '/@/renderer/hooks';
import { useArtistBackground, useCurrentServer, useCurrentServerId } from '/@/renderer/store';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { AlbumListSort, LibraryItem, SortOrder } from '/@/shared/types/domain-types';

const AlbumArtistDetailRouteContent = () => {
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const server = useCurrentServer();
    const serverId = useCurrentServerId();
    const { artistBackground, artistBackgroundBlur } = useArtistBackground();

    const { albumArtistId, artistId } = useParams() as {
        albumArtistId?: string;
        artistId?: string;
    };

    const routeId = (artistId || albumArtistId) as string;

    const [detailQuery, albumsQuery] = useSuspenseQueries({
        queries: [
            artistsQueries.albumArtistDetail({ query: { id: routeId }, serverId: server?.id }),
            albumQueries.list({
                query: {
                    artistIds: [routeId],
                    limit: -1,
                    sortBy: AlbumListSort.RELEASE_DATE,
                    sortOrder: SortOrder.DESC,
                    startIndex: 0,
                },
                serverId,
            }),
        ],
    });

    const imageUrl = useItemImageUrl({
        id: detailQuery.data?.imageId || undefined,
        imageUrl: detailQuery.data?.imageUrl,
        itemType: LibraryItem.ALBUM_ARTIST,
        type: 'header',
    });

    const libraryBackgroundImageUrl = useItemImageUrl({
        id: detailQuery.data?.imageId || undefined,
        itemType: LibraryItem.ALBUM_ARTIST,
        type: 'itemCard',
    });

    const selectedImageUrl = imageUrl || detailQuery.data?.imageUrl;

    const { background: backgroundColor, isLoading: isColorLoading } = useFastAverageColor({
        id: artistId,
        src: selectedImageUrl,
        srcLoaded: true,
    });

    const background = backgroundColor;

    const showBlurredImage = artistBackground;

    const { isReady } = useWaitForColorCalculation({
        hasImage: !!selectedImageUrl,
        isLoading: isColorLoading,
        routeId,
        showBlurredImage,
    });

    if (!isReady) {
        return <Spinner container />;
    }

    return (
        <AnimatedPage key={`album-artist-detail-${routeId}`}>
            <NativeScrollArea
                pageHeaderProps={{
                    backgroundColor: backgroundColor || undefined,
                    children: (
                        <LibraryHeaderBar>
                            <LibraryHeaderBar.PlayButton
                                ids={[routeId]}
                                itemType={LibraryItem.ALBUM_ARTIST}
                                variant="default"
                            />
                            <LibraryHeaderBar.Title>
                                {detailQuery.data?.name}
                            </LibraryHeaderBar.Title>
                        </LibraryHeaderBar>
                    ),
                    offset: 200,
                    target: headerRef,
                }}
                ref={scrollAreaRef}
            >
                {showBlurredImage ? (
                    <LibraryBackgroundImage
                        blur={artistBackgroundBlur}
                        headerRef={headerRef}
                        imageUrl={libraryBackgroundImageUrl || ''}
                    />
                ) : (
                    <LibraryBackgroundOverlay backgroundColor={background} headerRef={headerRef} />
                )}
                <LibraryContainer>
                    <AlbumArtistDetailHeader ref={headerRef as React.Ref<HTMLDivElement>} />
                    <AlbumArtistDetailContent albumsQuery={albumsQuery} detailQuery={detailQuery} />
                </LibraryContainer>
            </NativeScrollArea>
        </AnimatedPage>
    );
};

const AlbumArtistDetailRoute = () => {
    const { albumArtistId, artistId } = useParams() as {
        albumArtistId?: string;
        artistId?: string;
    };
    const routeId = (artistId || albumArtistId) as string;

    return (
        <Suspense fallback={<Spinner container />} key={`album-artist-detail-suspense-${routeId}`}>
            <AlbumArtistDetailRouteContent />
        </Suspense>
    );
};

const AlbumArtistDetailRouteWithBoundary = () => {
    return (
        <PageErrorBoundary>
            <AlbumArtistDetailRoute />
        </PageErrorBoundary>
    );
};

export default AlbumArtistDetailRouteWithBoundary;
