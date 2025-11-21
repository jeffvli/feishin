import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { useLocation, useParams } from 'react-router';

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
import { useFastAverageColor } from '/@/renderer/hooks';
import { useCurrentServer, useGeneralSettings } from '/@/renderer/store';
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

    const location = useLocation();

    const detailQuery = useQuery({
        ...artistsQueries.albumArtistDetail({
            query: { id: routeId },
            serverId: server?.id,
        }),
        initialData: location.state?.item,
        staleTime: 0,
    });

    const { background: backgroundColor } = useFastAverageColor({
        id: artistId,
        src: detailQuery.data?.imageUrl,
        srcLoaded: !detailQuery.isLoading,
    });

    const background = backgroundColor;
    const showBlurredImage = Boolean(detailQuery.data?.imageUrl) && artistBackground;

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
                {showBlurredImage && detailQuery.data?.imageUrl ? (
                    <LibraryBackgroundImage
                        blur={artistBackgroundBlur}
                        headerRef={headerRef}
                        imageUrl={detailQuery.data.imageUrl}
                    />
                ) : (
                    <LibraryBackgroundOverlay backgroundColor={background} headerRef={headerRef} />
                )}
                <LibraryContainer>
                    <AlbumArtistDetailHeader ref={headerRef as React.Ref<HTMLDivElement>} />
                    <AlbumArtistDetailContent />
                </LibraryContainer>
            </NativeScrollArea>
        </AnimatedPage>
    );
};

export default AlbumArtistDetailRoute;
