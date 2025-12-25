import { useQuery } from '@tanstack/react-query';
import { lazy, Suspense, useMemo, useRef, useState } from 'react';

import styles from './sidebar-play-queue.module.css';

import { ItemListHandle } from '/@/renderer/components/item-list/types';
import { lyricsQueries } from '/@/renderer/features/lyrics/api/lyrics-api';
import { Lyrics } from '/@/renderer/features/lyrics/lyrics';
import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';
import { PlayQueueListControls } from '/@/renderer/features/now-playing/components/play-queue-list-controls';
import {
    useGeneralSettings,
    usePlaybackSettings,
    usePlayerSong,
    useSettingsStore,
} from '/@/renderer/store';
import { Divider } from '/@/shared/components/divider/divider';
import { Flex } from '/@/shared/components/flex/flex';
import { Stack } from '/@/shared/components/stack/stack';
import { ItemListKey, PlayerType } from '/@/shared/types/types';

const AudioMotionAnalyzerVisualizer = lazy(() =>
    import('../../visualizer/components/audiomotionanalyzer/visualizer').then((module) => ({
        default: module.Visualizer,
    })),
);

const ButterchurnVisualizer = lazy(() =>
    import('../../visualizer/components/butternchurn/visualizer').then((module) => ({
        default: module.Visualizer,
    })),
);

export const SidebarPlayQueue = () => {
    const tableRef = useRef<ItemListHandle | null>(null);
    const [search, setSearch] = useState<string | undefined>(undefined);

    return (
        <Stack gap={0} h="100%" id="sidebar-play-queue-container" pos="relative" w="100%">
            <PlayQueueListControls
                handleSearch={setSearch}
                searchTerm={search}
                type={ItemListKey.SIDE_QUEUE}
            />
            <Flex direction="column" style={{ flex: 1, minHeight: 0 }}>
                <div className={styles.playQueueSection}>
                    <PlayQueue
                        listKey={ItemListKey.SIDE_QUEUE}
                        ref={tableRef}
                        searchTerm={search}
                    />
                </div>
            </Flex>
            <BottomPanel />
        </Stack>
    );
};

const BottomPanel = () => {
    const { showLyricsInSidebar, showVisualizerInSidebar } = useGeneralSettings();
    const { type, webAudio } = usePlaybackSettings();
    const visualizerType = useSettingsStore((store) => store.visualizer.type);
    const currentSong = usePlayerSong();

    const { data: lyricsData } = useQuery(
        lyricsQueries.songLyrics(
            {
                options: {
                    enabled: showLyricsInSidebar && !!currentSong?.id,
                },
                query: { songId: currentSong?.id || '' },
                serverId: currentSong?._serverId || '',
            },
            currentSong,
        ),
    );

    const hasLyrics = useMemo(() => {
        if (!lyricsData) return false;

        if (Array.isArray(lyricsData)) {
            return lyricsData.length > 0 && !!lyricsData[0]?.lyrics;
        }

        const lyrics = lyricsData?.lyrics;
        if (Array.isArray(lyrics)) {
            return lyrics.length > 0;
        }
        if (typeof lyrics === 'string') {
            return lyrics.trim().length > 0;
        }

        return false;
    }, [lyricsData]);

    const showVisualizer = showVisualizerInSidebar && type === PlayerType.WEB && webAudio;
    const showPanel = showLyricsInSidebar || showVisualizer;

    if (!showPanel) {
        return null;
    }

    return (
        <>
            <Divider />
            {showLyricsInSidebar ? (
                <div className={styles.lyricsSection}>
                    <Lyrics fadeOutNoLyricsMessage={showVisualizer} />
                    {showVisualizer && (
                        <div
                            className={styles.visualizerOverlay}
                            style={{
                                opacity: hasLyrics ? 0.2 : 1,
                            }}
                        >
                            <Suspense fallback={<></>}>
                                {visualizerType === 'butterchurn' ? (
                                    <ButterchurnVisualizer />
                                ) : (
                                    <AudioMotionAnalyzerVisualizer />
                                )}
                            </Suspense>
                        </div>
                    )}
                </div>
            ) : (
                showVisualizer && (
                    <div className={styles.visualizerSection}>
                        <Suspense fallback={<></>}>
                            {visualizerType === 'butterchurn' ? (
                                <ButterchurnVisualizer />
                            ) : (
                                <AudioMotionAnalyzerVisualizer />
                            )}
                        </Suspense>
                    </div>
                )
            )}
        </>
    );
};
