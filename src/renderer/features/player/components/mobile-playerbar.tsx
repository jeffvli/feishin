import formatDuration from 'format-duration';
import clsx from 'clsx';
import { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link, useNavigate } from 'react-router';

import styles from './mobile-playerbar.module.css';

import { ItemImage } from '/@/renderer/components/item-image/item-image';
import { ContextMenuController } from '/@/renderer/features/context-menu/context-menu-controller';
import { PlayerbarSeekSlider } from '/@/renderer/features/player/components/playerbar-seek-slider';
import { MainPlayButton, PlayerButton } from '/@/renderer/features/player/components/player-button';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { AppRoute } from '/@/renderer/router/routes';
import {
    useFullScreenPlayerStore,
    useFullScreenPlayerStoreActions,
    usePlayerRepeat,
    usePlayerShuffle,
    usePlayerSong,
    usePlayerStatus,
    usePlayerTimestamp,
    useSetFullScreenPlayerStore,
} from '/@/renderer/store';
import { Icon } from '/@/shared/components/icon/icon';
import { Text } from '/@/shared/components/text/text';
import { PlaybackSelectors } from '/@/shared/constants/playback-selectors';
import { LibraryItem } from '/@/shared/types/domain-types';
import { PlayerRepeat, PlayerShuffle, PlayerStatus } from '/@/shared/types/types';

export const MobilePlayerbar = () => {
    const { t } = useTranslation();
    const { expanded: isFullScreenPlayerExpanded } = useFullScreenPlayerStore();
    const setFullScreenPlayerStore = useSetFullScreenPlayerStore();
    const { setStore } = useFullScreenPlayerStoreActions();
    const currentSong = usePlayerSong();
    const status = usePlayerStatus();
    const { mediaNext, mediaPrevious, mediaStop, mediaTogglePlayPause, toggleRepeat, toggleShuffle } = usePlayer();
    const shuffle = usePlayerShuffle();
    const repeat = usePlayerRepeat();
    const currentTime = usePlayerTimestamp();
    const songDuration = currentSong?.duration ? currentSong.duration / 1000 : 0;
    const formattedTime = formatDuration(currentTime * 1000 || 0);
    const formattedDuration = formatDuration(songDuration * 1000 || 0);
    const navigate = useNavigate();

    const handleToggleFullScreenPlayer = (e?: KeyboardEvent | MouseEvent<HTMLDivElement>) => {
        e?.stopPropagation();
        setStore({ activeTab: 'player' });
        setFullScreenPlayerStore({ expanded: !isFullScreenPlayerExpanded });
    };

    const handleToggleContextMenu = (e: MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentSong) return;
        ContextMenuController.call({
            cmd: { items: [currentSong], type: LibraryItem.SONG },
            event: e as MouseEvent<HTMLDivElement>,
        });
    };

    const firstArtist = currentSong?.artists?.[0];

    return (
        <div className={clsx(styles.container, PlaybackSelectors.mediaPlayer)}>
            {/* Album art — spans both info and controls rows via CSS grid */}
            <div className={styles.artArea}>
                {currentSong?.id ? (
                    <div
                        className={styles.image}
                        onClick={handleToggleFullScreenPlayer}
                        onContextMenu={handleToggleContextMenu}
                        role="button"
                    >
                        <ItemImage
                            className={clsx(styles.playerbarImage, PlaybackSelectors.playerCoverArt)}
                            enableDebounce={false}
                            enableViewport={false}
                            explicitStatus={currentSong.explicitStatus}
                            fetchPriority="high"
                            id={currentSong.imageId}
                            itemType={LibraryItem.SONG}
                            type="table"
                        />
                    </div>
                ) : (
                    <div className={styles.image} />
                )}
            </div>

            {/* Title • Artist row */}
            <div className={styles.infoArea}>
                <Text
                    className={clsx(styles.infoTitle, PlaybackSelectors.songTitle)}
                    fw={500}
                    onClick={handleToggleFullScreenPlayer}
                    onContextMenu={handleToggleContextMenu}
                    size="sm"
                >
                    {currentSong?.name || '—'}
                </Text>
                {firstArtist && (
                    <>
                        <span className={styles.infoSeparator}>·</span>
                        <Text
                            className={styles.infoArtist}
                            component={firstArtist.id ? Link : undefined}
                            fw={400}
                            isLink={Boolean(firstArtist.id)}
                            size="xs"
                            to={
                                firstArtist.id
                                    ? generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                                          albumArtistId: firstArtist.id,
                                      })
                                    : undefined
                            }
                        >
                            {firstArtist.name}
                        </Text>
                    </>
                )}
            </div>

            {/* Playback controls row */}
            <div className={styles.controlsArea}>
                <PlayerButton
                    icon={<Icon fill="default" icon="mediaStop" size="sm" />}
                    onClick={(e) => { e.stopPropagation(); mediaStop(); }}
                    tooltip={{ label: t('player.stop', { postProcess: 'sentenceCase' }), openDelay: 0 }}
                    variant="tertiary"
                />
                <PlayerButton
                    icon={<Icon fill={shuffle === PlayerShuffle.NONE ? 'default' : 'primary'} icon="mediaShuffle" size="sm" />}
                    isActive={shuffle !== PlayerShuffle.NONE}
                    onClick={(e) => { e.stopPropagation(); toggleShuffle(); }}
                    tooltip={{ label: t('player.shuffle', { postProcess: 'sentenceCase' }), openDelay: 0 }}
                    variant="tertiary"
                />
                <PlayerButton
                    icon={<Icon fill="default" icon="mediaPrevious" size="sm" />}
                    onClick={(e) => { e.stopPropagation(); mediaPrevious(); }}
                    tooltip={{ label: t('player.previous', { postProcess: 'sentenceCase' }), openDelay: 0 }}
                    variant="tertiary"
                />
                <MainPlayButton
                    disabled={currentSong?.id === undefined}
                    isPaused={status === PlayerStatus.PAUSED}
                    onClick={(e) => { e.stopPropagation(); mediaTogglePlayPause(); }}
                />
                <PlayerButton
                    icon={<Icon fill="default" icon="mediaNext" size="sm" />}
                    onClick={(e) => { e.stopPropagation(); mediaNext(); }}
                    tooltip={{ label: t('player.next', { postProcess: 'sentenceCase' }), openDelay: 0 }}
                    variant="tertiary"
                />
                <PlayerButton
                    icon={
                        repeat === PlayerRepeat.ONE
                            ? <Icon fill="primary" icon="mediaRepeatOne" size="sm" />
                            : <Icon fill={repeat === PlayerRepeat.NONE ? 'default' : 'primary'} icon="mediaRepeat" size="sm" />
                    }
                    isActive={repeat !== PlayerRepeat.NONE}
                    onClick={(e) => { e.stopPropagation(); toggleRepeat(); }}
                    tooltip={{ label: t('player.repeat', { postProcess: 'sentenceCase' }), openDelay: 0 }}
                    variant="tertiary"
                />
                <PlayerButton
                    icon={<Icon fill="default" icon="settings" size="sm" />}
                    onClick={(e) => { e.stopPropagation(); navigate(AppRoute.SETTINGS); }}
                    tooltip={{ label: t('page.sidebar.settings', { postProcess: 'sentenceCase' }), openDelay: 0 }}
                    variant="tertiary"
                />
            </div>

            {/* Progress slider row */}
            <div className={styles.progressArea}>
                <span className={styles.progressTime}>{formattedTime}</span>
                <div className={styles.progressSlider}>
                    <PlayerbarSeekSlider max={songDuration} min={0} />
                </div>
                <span className={clsx(styles.progressTime, styles.progressTimeRight)}>
                    {formattedDuration}
                </span>
            </div>
        </div>
    );
};
