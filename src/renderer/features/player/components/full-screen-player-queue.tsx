import clsx from 'clsx';
import { motion } from 'motion/react';
import { CSSProperties, lazy, Suspense, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './full-screen-player-queue.module.css';

import { Lyrics } from '/@/renderer/features/lyrics/lyrics';
import { PlayQueue } from '/@/renderer/features/now-playing';
import { FullScreenSimilarSongs } from '/@/renderer/features/player/components/full-screen-similar-songs';
import { usePlaybackSettings } from '/@/renderer/store';
import {
    useFullScreenPlayerStore,
    useFullScreenPlayerStoreActions,
} from '/@/renderer/store/full-screen-player.store';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { PlaybackType } from '/@/shared/types/types';

const Visualizer = lazy(() =>
    import('/@/renderer/features/player/components/visualizer').then((module) => ({
        default: module.Visualizer,
    })),
);

export const FullScreenPlayerQueue = () => {
    const { t } = useTranslation();
    const { activeTab, opacity } = useFullScreenPlayerStore();
    const { setStore } = useFullScreenPlayerStoreActions();
    const { type, webAudio } = usePlaybackSettings();

    const headerItems = useMemo(() => {
        const items = [
            {
                active: activeTab === 'queue',
                label: t('page.fullscreenPlayer.upNext'),
                onClick: () => setStore({ activeTab: 'queue' }),
            },
            {
                active: activeTab === 'related',
                label: t('page.fullscreenPlayer.related'),
                onClick: () => setStore({ activeTab: 'related' }),
            },
            {
                active: activeTab === 'lyrics',
                label: t('page.fullscreenPlayer.lyrics'),
                onClick: () => setStore({ activeTab: 'lyrics' }),
            },
        ];

        if (type === PlaybackType.WEB && webAudio) {
            items.push({
                active: activeTab === 'visualizer',
                label: t('page.fullscreenPlayer.visualizer', { postProcess: 'titleCase' }),
                onClick: () => setStore({ activeTab: 'visualizer' }),
            });
        }

        return items;
    }, [activeTab, setStore, t, type, webAudio]);

    return (
        <div
            className={clsx(styles.gridContainer, 'full-screen-player-queue-container')}
            style={
                {
                    '--opacity': opacity / 100,
                } as CSSProperties
            }
        >
            <Group
                align="center"
                className="full-screen-player-queue-header"
                gap={0}
                grow
                justify="center"
            >
                {headerItems.map((item) => (
                    <div
                        className={styles.headerItemWrapper}
                        key={`tab-${item.label}`}
                    >
                        <Button
                            flex={1}
                            fw="600"
                            onClick={item.onClick}
                            pos="relative"
                            size="lg"
                            uppercase
                            variant="subtle"
                        >
                            {item.label}
                        </Button>
                        {item.active ? (
                            <motion.div
                                className={styles.activeTabIndicator}
                                layoutId="underline"
                            />
                        ) : null}
                    </div>
                ))}
            </Group>
            {activeTab === 'queue' ? (
                <div className={styles.queueContainer}>
                    <PlayQueue type="fullScreen" />
                </div>
            ) : activeTab === 'related' ? (
                <div className={styles.queueContainer}>
                    <FullScreenSimilarSongs />
                </div>
            ) : activeTab === 'lyrics' ? (
                <Lyrics />
            ) : activeTab === 'visualizer' && type === PlaybackType.WEB && webAudio ? (
                <Suspense fallback={<></>}>
                    <Visualizer />
                </Suspense>
            ) : null}
        </div>
    );
};
