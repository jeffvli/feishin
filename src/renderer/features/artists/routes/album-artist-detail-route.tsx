import { useQuery } from '@tanstack/react-query';
import { Suspense, useRef } from 'react';
import { useParams } from 'react-router';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { NativeScrollArea } from '/@/renderer/components/native-scroll-area/native-scroll-area';
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
import { useCurrentServer, useGeneralSettings } from '/@/renderer/store';
import { Spinner } from '/@/shared/components/spinner/spinner';
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

    const detailQuery = useQuery({
        ...artistsQueries.albumArtistDetail({ query: { id: routeId }, serverId: server?.id }),
        staleTime: 0,
    });

    const imageUrl = useItemImageUrl({
        id: detailQuery?.data?.imageId || undefined,
        imageUrl: detailQuery.data?.imageUrl,
        itemType: LibraryItem.ALBUM_ARTIST,
        type: 'header',
    });

    const libraryBackgroundImageUrl = useItemImageUrl({
        id: detailQuery?.data?.imageId || undefined,
        itemType: LibraryItem.ALBUM_ARTIST,
        type: 'itemCard',
    });

    const selectedImageUrl = imageUrl || detailQuery.data?.imageUrl;

    const { background: backgroundColor, isLoading: isColorLoading } = useFastAverageColor({
        id: artistId,
        src: selectedImageUrl,
        srcLoaded: !detailQuery.isLoading,
    });

    const background = backgroundColor;

    const showBlurredImage = artistBackground;

    const { isReady } = useWaitForColorCalculation({
        hasImage: !!selectedImageUrl,
        isLoading: isColorLoading,
        routeId,
        showBlurredImage,
    });

    if (detailQuery.isLoading || !isReady) {
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
                                {detailQuery?.data?.name}
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
                    <Suspense fallback={<Spinner container />}>
                        <AlbumArtistDetailContent />
                    </Suspense>
                </LibraryContainer>
            </NativeScrollArea>
        </AnimatedPage>
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
