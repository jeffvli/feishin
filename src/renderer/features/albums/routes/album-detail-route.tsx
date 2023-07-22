import { NativeScrollArea } from '/@/renderer/components';
import { AnimatedPage, LibraryHeaderBar } from '/@/renderer/features/shared';
import { useRef } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useAlbumDetail } from '/@/renderer/features/albums/queries/album-detail-query';
import { useParams } from 'react-router';
import { useFastAverageColor } from '/@/renderer/hooks';
import { AlbumDetailContent } from '/@/renderer/features/albums/components/album-detail-content';
import { AlbumDetailHeader } from '/@/renderer/features/albums/components/album-detail-header';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { LibraryItem } from '/@/renderer/api/types';
import { useCurrentServer } from '/@/renderer/store';

const AlbumDetailRoute = () => {
    const tableRef = useRef<AgGridReactType | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);

    const { albumId } = useParams() as { albumId: string };
    const server = useCurrentServer();
    const detailQuery = useAlbumDetail({ query: { id: albumId }, serverId: server?.id });
    const background = useFastAverageColor(detailQuery.data?.imageUrl, !detailQuery.isLoading);
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

    if (!background) return null;

    return (
        <AnimatedPage key={`album-detail-${albumId}`}>
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
                <AlbumDetailHeader
                    ref={headerRef}
                    background={background}
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
