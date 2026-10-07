import isElectron from 'is-electron';
import { useEffect } from 'react';
import { create } from 'zustand';

import styles from './mini-player.module.css';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { SourVisualizer } from '/@/renderer/features/sour/visualizer/sour-visualizer';
import { usePlayerSong, usePlayerStatus } from '/@/renderer/store/player.store';
import { usePlayerTimestamp } from '/@/renderer/store/timestamp.store';
import { Icon } from '/@/shared/components/icon/icon';
import { LibraryItem } from '/@/shared/types/domain-types';
import { PlayerStatus } from '/@/shared/types/types';

const useMini = create<{ on: boolean }>(() => ({ on: false }));

export const isMiniPlayer = () => useMini.getState().on;

// The mini player: a small always-on-top window with the cover, the song, the controls, a seek bar
// and a little visualizer. Drag it anywhere by its background; the expand button (or Ctrl+Alt+M)
// brings the full window back.
export const toggleMiniPlayer = () => {
    const on = !useMini.getState().on;
    useMini.setState({ on });
    document.documentElement.classList.toggle('sour-mini', on);
    if (isElectron()) window.api?.ipc?.send('sour-mini', on);
};

const time = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const MiniPlayerView = () => {
    const song = usePlayerSong();
    const status = usePlayerStatus();
    const timestamp = usePlayerTimestamp();
    const { mediaNext, mediaPrevious, mediaSeekToTimestamp, mediaTogglePlayPause } = usePlayer();
    const showBars = useSourStore((s) => s.look.barVisualizer);
    const style = useSourStore((s) => s.look.visualizer);
    const cover = useItemImageUrl({
        id: song?.imageId || undefined,
        itemType: LibraryItem.SONG,
        type: 'itemCard',
    });
    const duration = (song?.duration || 0) / 1000;
    const progress = duration ? Math.min(1, timestamp / duration) : 0;
    const playing = status === PlayerStatus.PLAYING;

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === ' ' && !(e.target instanceof HTMLInputElement)) {
                e.preventDefault();
                mediaTogglePlayPause();
            }
            if (e.key === 'Escape') toggleMiniPlayer();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [mediaTogglePlayPause]);

    return (
        <div className={styles.mini}>
            {cover && <div className={styles.backdrop} style={{ backgroundImage: `url("${cover}")` }} />}
            <div className={styles.cover}>
                {cover ? <img alt="" src={cover} /> : <Icon icon="itemSong" size="xl" />}
            </div>
            <div className={styles.body}>
                <div className={styles.top}>
                    <div className={styles.titles}>
                        <div className={styles.title} title={song?.name}>
                            {song?.name ?? 'Nothing playing'}
                        </div>
                        <div className={styles.artist}>{song?.artistName ?? ''}</div>
                    </div>
                    <button
                        aria-label="Back to the full window"
                        className={styles.icon}
                        onClick={toggleMiniPlayer}
                        title="Back to the full window (Esc)"
                        type="button"
                    >
                        <Icon icon="expand" />
                    </button>
                </div>
                <div className={styles.controls}>
                    <button
                        aria-label="Previous"
                        className={styles.icon}
                        onClick={() => mediaPrevious(false)}
                        type="button"
                    >
                        <Icon icon="mediaPrevious" />
                    </button>
                    <button
                        aria-label={playing ? 'Pause' : 'Play'}
                        className={styles.play}
                        onClick={mediaTogglePlayPause}
                        type="button"
                    >
                        <Icon icon={playing ? 'mediaPause' : 'mediaPlay'} />
                    </button>
                    <button
                        aria-label="Next"
                        className={styles.icon}
                        onClick={() => mediaNext(false)}
                        type="button"
                    >
                        <Icon icon="mediaNext" />
                    </button>
                    <span className={styles.time}>
                        {time(timestamp)} / {time(duration)}
                    </span>
                </div>
                <div
                    aria-label="Seek"
                    aria-valuemax={Math.round(duration)}
                    aria-valuemin={0}
                    aria-valuenow={Math.round(timestamp)}
                    className={styles.seek}
                    onClick={(e) => {
                        const r = e.currentTarget.getBoundingClientRect();
                        if (duration) mediaSeekToTimestamp(((e.clientX - r.left) / r.width) * duration);
                    }}
                    role="slider"
                    tabIndex={0}
                >
                    <div style={{ width: `${progress * 100}%` }} />
                </div>
            </div>
            {showBars && (
                <div className={styles.viz}>
                    <SourVisualizer style={style === 'river' ? 'river' : 'bars'} />
                </div>
            )}
        </div>
    );
};

export const MiniPlayer = () => {
    const on = useMini((s) => s.on);
    return on ? <MiniPlayerView /> : null;
};
