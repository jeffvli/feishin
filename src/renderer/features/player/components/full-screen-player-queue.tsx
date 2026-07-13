import clsx from 'clsx';
import { CSSProperties, lazy, Suspense, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './full-screen-player-queue.module.css';

import { Lyrics } from '/@/renderer/features/lyrics/lyrics';
import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';
import { FullScreenSimilarSongs } from '/@/renderer/features/player/components/full-screen-similar-songs';
import { usePlaybackSettings, useSettingsStore } from '/@/renderer/store';
import {
    useFullScreenPlayerStore,
    useFullScreenPlayerStoreActions,
} from '/@/renderer/store/full-screen-player.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Group } from '/@/shared/components/group/group';
import { AppIcon } from '/@/shared/components/icon/icon';
import { ItemListKey } from '/@/shared/types/types';

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

interface ControlItem {
    active: boolean;
    icon: keyof typeof AppIcon;
    label: string;
    onClick: () => void;
}

const Controls = () => {
    const { t } = useTranslation();
    const { activeTab } = useFullScreenPlayerStore();
    const { setStore } = useFullScreenPlayerStoreActions();
    const { webAudio } = usePlaybackSettings();

    const headerItems = useMemo(() => {
        const items: ControlItem[] = [
            {
                active: activeTab === 'queue',
                icon: 'queue',
                label: t('page.fullscreenPlayer.upNext'),
                onClick: () => setStore({ activeTab: 'queue' }),
            },
            {
                active: activeTab === 'related',
                icon: 'related',
                label: t('page.fullscreenPlayer.related'),
                onClick: () => setStore({ activeTab: 'related' }),
            },
            {
                active: activeTab === 'lyrics',
                icon: 'microphone',
                label: t('page.fullscreenPlayer.lyrics'),
                onClick: () => setStore({ activeTab: 'lyrics' }),
            },
        ];

        if (webAudio) {
            items.push({
                active: activeTab === 'visualizer',
                icon: 'audioLines',
                label: t('page.fullscreenPlayer.visualizer'),
                onClick: () => setStore({ activeTab: 'visualizer' }),
            });
        }

        return items;
    }, [activeTab, setStore, t, webAudio]);

    return (
        <Group
            className="full-screen-player-queue-header"
            gap="xs"
            p="1rem"
            pos="absolute"
            style={{
                bottom: 0,
                right: 0,
            }}
        >
            {headerItems.map((item) => (
                <div key={`tab-${item.label}`}>
                    <ActionIcon
                        icon={item.icon}
                        iconProps={{
                            fill: item.active ? 'primary' : undefined,
                            size: 'lg',
                        }}
                        onClick={item.onClick}
                        tooltip={{ label: item.label }}
                        variant="subtle"
                    ></ActionIcon>
                </div>
            ))}
        </Group>
    );
};

export const FullScreenPlayerQueue = () => {
    const { activeTab, opacity } = useFullScreenPlayerStore();
    const { webAudio } = usePlaybackSettings();
    const visualizerType = useSettingsStore((store) => store.visualizer.type);

    return (
        <>
            <div
                className={clsx(styles.gridContainer, 'full-screen-player-queue-container')}
                style={
                    {
                        '--opacity': opacity / 100,
                    } as CSSProperties
                }
            >
                {activeTab === 'queue' ? (
                    <div className={styles.queueContainer}>
                        <PlayQueue
                            enableScrollShadow={false}
                            listKey={ItemListKey.FULL_SCREEN}
                            searchTerm={undefined}
                        />
                    </div>
                ) : activeTab === 'related' ? (
                    <div className={styles.queueContainer}>
                        <FullScreenSimilarSongs />
                    </div>
                ) : activeTab === 'lyrics' ? (
                    <Lyrics fadeOutNoLyricsMessage={false} />
                ) : activeTab === 'visualizer' && webAudio ? (
                    <Suspense fallback={<></>}>
                        {visualizerType === 'butterchurn' ? (
                            <ButterchurnVisualizer />
                        ) : (
                            <AudioMotionAnalyzerVisualizer />
                        )}
                    </Suspense>
                ) : null}
            </div>

            <Controls />
        </>
    );
};
