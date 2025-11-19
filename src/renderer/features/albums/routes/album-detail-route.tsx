import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { useParams } from 'react-router';

import { NativeScrollArea } from '/@/renderer/components/native-scroll-area/native-scroll-area';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { AlbumDetailContent } from '/@/renderer/features/albums/components/album-detail-content';
import { AlbumDetailHeader } from '/@/renderer/features/albums/components/album-detail-header';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { LibraryHeaderBar } from '/@/renderer/features/shared/components/library-header-bar';
import { useFastAverageColor } from '/@/renderer/hooks';
import { useCurrentServer, useGeneralSettings } from '/@/renderer/store';
import { LibraryItem } from '/@/shared/types/domain-types';

const AlbumDetailRoute = () => {
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const { albumBackground, albumBackgroundBlur } = useGeneralSettings();

    const { albumId } = useParams() as { albumId: string };
    const server = useCurrentServer();

    const detailQuery = useQuery(
        albumQueries.detail({ query: { id: albumId }, serverId: server?.id }),
    );

    const { background: backgroundColor, colorId } = useFastAverageColor({
        id: albumId,
        src: detailQuery.data?.imageUrl,
        srcLoaded: !detailQuery.isLoading,
    });

    const backgroundUrl = detailQuery.data?.imageUrl || '';
    const background = (albumBackground && `url(${backgroundUrl})`) || backgroundColor;

    return (
        <AnimatedPage key={`album-detail-${albumId}`}>
            <NativeScrollArea
                pageHeaderProps={{
                    backgroundColor: backgroundColor || undefined,
                    children: (
                        <LibraryHeaderBar>
                            <LibraryHeaderBar.PlayButton
                                ids={[albumId]}
                                itemType={LibraryItem.ALBUM}
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
                <AlbumDetailHeader
                    background={{
                        background,
                        blur: (albumBackground && albumBackgroundBlur) || 0,
                        loading: !backgroundColor || colorId !== albumId,
                    }}
                    ref={headerRef}
                />
                <AlbumDetailContent background={background} />
            </NativeScrollArea>
        </AnimatedPage>
    );
};

export default AlbumDetailRoute;
