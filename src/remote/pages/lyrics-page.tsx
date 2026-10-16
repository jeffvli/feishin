import { useEffect, useMemo, useRef, useState } from 'react';

import { useInfo } from '/@/remote/store';
import { fetchLyrics, LyricLine } from '/@/remote/utils/lyrics';

import styles from './lyrics-page.module.css';

type Status = 'error' | 'idle' | 'loading' | 'no-song';

export const LyricsPage = () => {
    const info = useInfo();
    const song = info.song;
    // SongUpdateSocket.position — broadcast by the desktop's 'position' /
    // 'state' events (ServerPosition.data is a number; see remote-types.ts).
    const position = info.position ?? 0;

    const [lyrics, setLyrics] = useState<LyricLine[] | null>(null);
    const [status, setStatus] = useState<Status>(song ? 'loading' : 'no-song');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!song) {
            setLyrics(null);
            setStatus('no-song');
            return;
        }

        let cancelled = false;
        setStatus('loading');
        setLyrics(null);

        fetchLyrics({
            albumName: song.albumName,
            artistName: song.artistName,
            duration: song.duration ?? undefined,
            name: song.name,
        })
            .then((res) => {
                if (cancelled) return;
                setLyrics(res);
                setStatus('idle');
            })
            .catch(() => {
                if (cancelled) return;
                setLyrics(null);
                setStatus('error');
            });

        return () => {
            cancelled = true;
        };
        // Refetch only on track change — position updates ~5x/sec and would
        // otherwise re-trigger the network call continuously.
    }, [song?.id]);

    const isSynced = useMemo(
        () => !!lyrics && lyrics.some((l) => l.time != null),
        [lyrics],
    );

    const activeIndex = useMemo(() => {
        if (!lyrics || !isSynced) return -1;
        let idx = -1;
        for (let i = 0; i < lyrics.length; i++) {
            const t = lyrics[i].time;
            if (t == null) continue;
            if (t <= position) idx = i;
            else break;
        }
        return idx;
    }, [lyrics, isSynced, position]);

    useEffect(() => {
        if (activeIndex < 0) return;
        containerRef.current
            ?.querySelector<HTMLElement>(`[data-line="${activeIndex}"]`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [activeIndex]);

    if (status === 'no-song') {
        return (
            <div className={styles.center}>
                <span className={styles.dim}>Nothing playing</span>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.title}>{song?.name}</div>
                <div className={styles.artist}>{song?.artistName}</div>
            </header>

            {status === 'loading' && (
                <div className={styles.center}>Loading lyrics…</div>
            )}
            {status === 'error' && (
                <div className={styles.center}>
                    No lyrics available for this track
                </div>
            )}

            {status === 'idle' && lyrics && (
                <div className={styles.body} ref={containerRef}>
                    {lyrics.map((line, i) => (
                        <div
                            className={
                                i === activeIndex ? styles.lineActive : styles.line
                            }
                            data-line={i}
                            key={i}
                        >
                            {line.text || '\u00A0'}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};