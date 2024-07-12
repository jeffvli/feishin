import { NativeScrollArea, Spinner } from '/@/renderer/components';
import { AnimatedPage, LibraryHeaderBar } from '/@/renderer/features/shared';
import { useRef } from 'react';
import { useParams } from 'react-router';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { LibraryItem } from '/@/renderer/api/types';
import { useSongInfo } from '/@/renderer/features/songs/queries/song-info-query';
import { MixInfoContent } from '/@/renderer/features/mixes/components/mix-info-content';
import { getPublicServer } from '/@/renderer/store';
import { SongInfoHeader } from '/@/renderer/features/songs/components/song-info-header';

const MixInfoRoute = () => {
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);

    const { songId } = useParams() as { songId: string };

    const server = getPublicServer();
    const detailQuery = useSongInfo({ query: { id: songId }, serverId: server?.id });

    const handlePlayQueueAdd = usePlayQueueAdd();
    const playButtonBehavior = usePlayButtonBehavior();
    const background = 'var(--modal-bg)';

    const handlePlay = () => {
        handlePlayQueueAdd?.({
            byItemType: {
                id: [songId],
                type: LibraryItem.SONG,
            },
            playType: playButtonBehavior,
        });
    };

    if (detailQuery.isLoading || detailQuery.data === undefined) {
        return <Spinner container />;
    }

    return (
        <AnimatedPage key={`song-info-${songId}`}>
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
                <SongInfoHeader
                    ref={headerRef}
                    background={background}
                    serv={server}
                />
                <MixInfoContent background={background} />
            </NativeScrollArea>
        </AnimatedPage>
    );
};

export default MixInfoRoute;
