import { useQuery } from '@tanstack/react-query';
import isElectron from 'is-electron';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
// import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels';
import { Pane, SplitPane, usePersistence } from 'react-split-pane';

import styles from './sidebar-play-queue.module.css';

import { ItemListHandle } from '/@/renderer/components/item-list/types';
import { lyricsQueries } from '/@/renderer/features/lyrics/api/lyrics-api';
import { Lyrics } from '/@/renderer/features/lyrics/lyrics';
import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';
import { PlayQueueListControls } from '/@/renderer/features/now-playing/components/play-queue-list-controls';
import {
    useCombinedLyricsAndVisualizer,
    useFullScreenPlayerStore,
    usePlaybackSettings,
    usePlayerSong,
    useSettingsStore,
    useSettingsStoreActions,
    useShowLyricsInSidebar,
    useShowVisualizerInSidebar,
    useSidebarPanelOrder,
    useWindowSettings,
} from '/@/renderer/store';
import { ActionIcon, ActionIconGroup } from '/@/shared/components/action-icon/action-icon';
import { Flex } from '/@/shared/components/flex/flex';
import { Stack } from '/@/shared/components/stack/stack';
import { ItemListKey, Platform, PlayerType } from '/@/shared/types/types';

type SidebarPanelType = 'lyrics' | 'queue' | 'visualizer';

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
    const { expanded: isFullScreenPlayerExpanded } = useFullScreenPlayerStore();
    const [shouldRender, setShouldRender] = useState(!isFullScreenPlayerExpanded);
    const combinedLyricsAndVisualizer = useCombinedLyricsAndVisualizer();
    const showLyricsInSidebar = useShowLyricsInSidebar();
    const showVisualizerInSidebar = useShowVisualizerInSidebar();
    const sidebarPanelOrder = useSidebarPanelOrder();
    const { type, webAudio } = usePlaybackSettings();
    const { windowBarStyle } = useWindowSettings();
    const showVisualizer = showVisualizerInSidebar && type === PlayerType.WEB && webAudio;
    const showPanel = showLyricsInSidebar || showVisualizer;

    const shouldAddTopMargin = isElectron() && windowBarStyle === Platform.WEB;

    useEffect(() => {
        if (isFullScreenPlayerExpanded) {
            // Immediately hide when fullscreen player opens
            setShouldRender(false);
            return undefined;
        } else {
            // Wait 500ms before re-rendering when fullscreen player closes to avoid performance issues
            const timeoutId = setTimeout(() => {
                setShouldRender(true);
            }, 500);

            return () => {
                clearTimeout(timeoutId);
            };
        }
    }, [isFullScreenPlayerExpanded]);

    const [defaultLayout, onLayoutChange] = usePersistence({
        debounce: 300,
        key: 'sidebar-play-queue-container',
        storage: localStorage,
    });

    // Filter and order panels based on what's enabled
    const orderedPanels = useMemo(() => {
        if (combinedLyricsAndVisualizer) {
            // When combined, use the order from settings but filter to only show queue and lyrics (combined)
            const visiblePanels = sidebarPanelOrder.filter((panel) => {
                if (panel === 'queue') return true;
                if (panel === 'lyrics') return showLyricsInSidebar || showVisualizer;
                return false;
            });
            return visiblePanels;
        }

        const visiblePanels = sidebarPanelOrder.filter((panel) => {
            if (panel === 'queue') return true;
            if (panel === 'lyrics') return showLyricsInSidebar;
            if (panel === 'visualizer') return showVisualizer;
            return false;
        });

        return visiblePanels;
    }, [combinedLyricsAndVisualizer, showLyricsInSidebar, showVisualizer, sidebarPanelOrder]);

    const renderPanel = (panelType: SidebarPanelType) => {
        if (panelType === 'queue') {
            return (
                <Stack gap={0} h="100%" w="100%">
                    <PlayQueueListControls
                        handleSearch={setSearch}
                        searchTerm={search}
                        type={ItemListKey.SIDE_QUEUE}
                    />
                    <div className={styles.playQueueSection}>
                        <PlayQueue
                            listKey={ItemListKey.SIDE_QUEUE}
                            ref={tableRef}
                            searchTerm={search}
                        />
                    </div>
                </Stack>
            );
        }

        if (combinedLyricsAndVisualizer && (panelType === 'lyrics' || panelType === 'visualizer')) {
            return <CombinedLyricsAndVisualizerPanel />;
        }

        if (panelType === 'lyrics') {
            return <LyricsPanel />;
        }

        if (panelType === 'visualizer') {
            return <VisualizerPanel />;
        }

        return null;
    };

    const getPanelSize = useCallback(
        (panelType: SidebarPanelType, index: number) => {
            // Queue panel should always autofit
            if (panelType === 'queue') {
                return undefined;
            }

            // If defaultLayout exists and has saved sizes, use them
            if (
                defaultLayout &&
                Array.isArray(defaultLayout) &&
                defaultLayout[index] !== undefined
            ) {
                return defaultLayout[index];
            }

            // Calculate default sizes for non-queue panels based on order
            const nonQueuePanels = orderedPanels.filter((p) => p !== 'queue');
            const nonQueueCount = nonQueuePanels.length;

            if (nonQueueCount === 0) {
                return undefined;
            }

            // If only one non-queue panel, give it a default size
            if (nonQueueCount === 1) {
                return 100;
            }

            // If multiple non-queue panels, distribute sizes evenly
            // First non-queue panel gets a size, others get undefined to share remaining
            const nonQueueIndex = orderedPanels.slice(0, index).filter((p) => p !== 'queue').length;
            if (nonQueueIndex === 0) {
                // First non-queue panel gets a default size
                return 100;
            }

            // Other non-queue panels autofit
            return undefined;
        },
        [defaultLayout, orderedPanels],
    );

    // Unmount when fullscreen player is open
    if (!shouldRender) {
        return null;
    }

    return (
        <Stack gap={0} h="100%" id="sidebar-play-queue-container" pos="relative" w="100%">
            {shouldAddTopMargin && <div className={styles.draggableRegion} />}
            {showPanel ? (
                <SplitPane
                    direction="vertical"
                    dividerClassName={styles.resizeHandle}
                    onResize={onLayoutChange}
                    style={{
                        display: 'flex',
                        flex: 1,
                        flexDirection: 'column',
                        minHeight: 0,
                        overflow: 'hidden',
                    }}
                >
                    {orderedPanels.map((panel, index) => (
                        <Pane key={panel} size={getPanelSize(panel, index)}>
                            {renderPanel(panel)}
                        </Pane>
                    ))}
                </SplitPane>
            ) : (
                <Stack gap={0} h="100%" w="100%">
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
                </Stack>
            )}
        </Stack>
    );
};

const PanelReorderControls = ({ panelType }: { panelType: 'lyrics' | 'visualizer' }) => {
    const { t } = useTranslation();
    const { setSettings } = useSettingsStoreActions();
    const sidebarPanelOrder = useSidebarPanelOrder();
    const combinedLyricsAndVisualizer = useCombinedLyricsAndVisualizer();

    const currentIndex = sidebarPanelOrder.indexOf(panelType);
    const canMoveUp = currentIndex > 0;
    const canMoveDown = currentIndex < sidebarPanelOrder.length - 1;

    const handleMoveUp = useCallback(() => {
        if (!canMoveUp) return;

        const newOrder = [...sidebarPanelOrder];
        const targetIndex = currentIndex - 1;

        [newOrder[currentIndex], newOrder[targetIndex]] = [
            newOrder[targetIndex],
            newOrder[currentIndex],
        ];

        setSettings({
            general: {
                sidebarPanelOrder: newOrder,
            },
        });
    }, [canMoveUp, currentIndex, sidebarPanelOrder, setSettings]);

    const handleMoveDown = useCallback(() => {
        if (!canMoveDown) return;

        const newOrder = [...sidebarPanelOrder];
        [newOrder[currentIndex], newOrder[currentIndex + 1]] = [
            newOrder[currentIndex + 1],
            newOrder[currentIndex],
        ];

        setSettings({
            general: {
                sidebarPanelOrder: newOrder,
            },
        });
    }, [canMoveDown, currentIndex, sidebarPanelOrder, setSettings]);

    const handleClose = useCallback(() => {
        if (combinedLyricsAndVisualizer && panelType === 'lyrics') {
            setSettings({
                general: {
                    showLyricsInSidebar: false,
                    showVisualizerInSidebar: false,
                },
            });
        } else if (panelType === 'lyrics') {
            setSettings({
                general: {
                    showLyricsInSidebar: false,
                },
            });
        } else if (panelType === 'visualizer') {
            setSettings({
                general: {
                    showVisualizerInSidebar: false,
                },
            });
        }
    }, [combinedLyricsAndVisualizer, panelType, setSettings]);

    return (
        <div className={styles.panelReorderControls}>
            <ActionIconGroup>
                <ActionIcon
                    disabled={!canMoveUp}
                    icon="arrowUp"
                    iconProps={{ size: 'sm' }}
                    onClick={handleMoveUp}
                    size="xs"
                    tooltip={{
                        label: t('action.moveUp', { postProcess: 'sentenceCase' }),
                    }}
                    variant="subtle"
                />
                <ActionIcon
                    disabled={!canMoveDown}
                    icon="arrowDown"
                    iconProps={{ size: 'sm' }}
                    onClick={handleMoveDown}
                    size="xs"
                    tooltip={{
                        label: t('action.moveDown', { postProcess: 'sentenceCase' }),
                    }}
                    variant="subtle"
                />
                <ActionIcon
                    icon="x"
                    iconProps={{ size: 'sm' }}
                    onClick={handleClose}
                    size="xs"
                    tooltip={{
                        label: t('common.close', { postProcess: 'sentenceCase' }),
                    }}
                    variant="subtle"
                />
            </ActionIconGroup>
        </div>
    );
};

const LyricsPanel = () => {
    return (
        <div className={styles.lyricsSection}>
            <PanelReorderControls panelType="lyrics" />
            <Lyrics fadeOutNoLyricsMessage={false} settingsKey="sidebar" />
        </div>
    );
};

const VisualizerPanel = () => {
    const visualizerType = useSettingsStore((store) => store.visualizer.type);

    return (
        <div className={styles.visualizerSection}>
            <PanelReorderControls panelType="visualizer" />
            <Suspense fallback={<></>}>
                {visualizerType === 'butterchurn' ? (
                    <ButterchurnVisualizer />
                ) : (
                    <AudioMotionAnalyzerVisualizer />
                )}
            </Suspense>
        </div>
    );
};

const CombinedLyricsAndVisualizerPanel = () => {
    const currentSong = usePlayerSong();
    const visualizerType = useSettingsStore((store) => store.visualizer.type);

    const { data: lyricsData } = useQuery(
        lyricsQueries.songLyrics(
            {
                options: {
                    enabled: !!currentSong?.id,
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

    return (
        <div className={styles.lyricsSection}>
            <PanelReorderControls panelType="lyrics" />
            <Lyrics fadeOutNoLyricsMessage={true} settingsKey="sidebar" />
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
        </div>
    );
};
