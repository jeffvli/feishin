import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { useRef } from 'react';
import { useParams } from 'react-router';

import { NativeScrollArea } from '/@/renderer/components/native-scroll-area/native-scroll-area';
import { AlbumDetailContent } from '/@/renderer/features/albums/components/album-detail-content';
import { AlbumDetailHeader } from '/@/renderer/features/albums/components/album-detail-header';
import { useAlbumDetail } from '/@/renderer/features/albums/queries/album-detail-query';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { AnimatedPage, LibraryHeaderBar } from '/@/renderer/features/shared';
import { useFastAverageColor } from '/@/renderer/hooks';
import { useCurrentServer, useGeneralSettings } from '/@/renderer/store';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { LibraryItem } from '/@/shared/types/domain-types';

const AlbumDetailRoute = () => {
    const tableRef = useRef<AgGridReactType | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const { albumBackground, albumBackgroundBlur } = useGeneralSettings();

    const { albumId } = useParams() as { albumId: string };
    const server = useCurrentServer();
    const detailQuery = useAlbumDetail({ query: { id: albumId }, serverId: server?.id });
    const { background: backgroundColor, colorId } = useFastAverageColor({
        id: albumId,
        src: detailQuery.data?.imageUrl,
        srcLoaded: !detailQuery.isLoading,
    });
    const handlePlayQueueAdd = usePlayQueueAdd();
    const playButtonBehavior = usePlayButtonBehavior();

    const handlePlay = () => {
        handlePlayQueueAdd?.({
            byItemType: {
                id: [albumId],
                type: LibraryItem.ALBUM,
            },
            playType: playButtonBehavior,
        });
    };

    const backgroundUrl = detailQuery.data?.imageUrl || '';
    const background = (albumBackground && `url(${backgroundUrl})`) || backgroundColor;

    return (
        <AnimatedPage key={`album-detail-${albumId}`}>
            <NativeScrollArea
                pageHeaderProps={{
                    backgroundColor: backgroundColor || undefined,
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
                <AlbumDetailHeader
                    background={{
                        background,
                        blur: (albumBackground && albumBackgroundBlur) || 0,
                        loading: !backgroundColor || colorId !== albumId,
                    }}
                    ref={headerRef}
                />
                <AlbumDetailContent
                    background={background}
                    tableRef={tableRef}
                />
            </NativeScrollArea>
        </AnimatedPage>
    );
};

export default AlbumDetailRoute;
