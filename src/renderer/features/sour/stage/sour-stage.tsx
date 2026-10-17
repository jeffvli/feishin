import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { create } from 'zustand';

import styles from './sour-stage.module.css';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { ContextMenuController } from '/@/renderer/features/context-menu/context-menu-controller';
import { useGroupPlayStore } from '/@/renderer/features/group-play/store/group-play.store';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { lyricsQueries } from '/@/renderer/features/lyrics/api/lyrics-api';
import { MobileFullscreenPlayerBottomControls } from '/@/renderer/features/player/components/mobile-fullscreen-player-bottom-controls';
import { MobileFullscreenPlayerControls } from '/@/renderer/features/player/components/mobile-fullscreen-player-controls';
import { MobileFullscreenPlayerProgress } from '/@/renderer/features/player/components/mobile-fullscreen-player-progress';
import { SleepTimerButton } from '/@/renderer/features/player/components/sleep-timer-button';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { socialApi } from '/@/renderer/features/sour/api/social-api';
import { avatarUrl } from '/@/renderer/features/sour/api/sour-api';
import { openProfile } from '/@/renderer/features/sour/components/people';
import { hue, ProfileAvatar } from '/@/renderer/features/sour/components/profile-bits';
import { isNativeApp } from '/@/renderer/features/sour/mobile/android';
import { usePhoneStore } from '/@/renderer/features/sour/mobile/phone-store';
import {
    clearLoop,
    setLoopPoint,
    setSpeedPreset,
    SPEEDS,
    useLoop,
} from '/@/renderer/features/sour/stage/loop';
import { PeelOff } from '/@/renderer/features/sour/stage/peel-off';
import { usePlayContext } from '/@/renderer/features/sour/stage/play-context';
import { Scene, SCENES } from '/@/renderer/features/sour/stage/scenes';
import {
    KaraokeLine,
    type Line,
    LyricsTools,
    restoreKaraokeVolume,
} from '/@/renderer/features/sour/stage/stage-lyrics';
import {
    type SourLook,
    useMyProfile,
    useSourProfiles,
    useSourStore,
} from '/@/renderer/features/sour/store/sour.store';
import { getReason } from '/@/renderer/features/sour/utils/reasons';
import {
    makeLevels,
    readLevels,
    useLevelSource,
} from '/@/renderer/features/sour/visualizer/levels';
import {
    SourVisualizer,
    VISUALIZER_STYLES,
} from '/@/renderer/features/sour/visualizer/sour-visualizer';
import { useFastAverageColor } from '/@/renderer/hooks';
import { useIsMobile } from '/@/renderer/hooks/use-is-mobile';
import { AppRoute } from '/@/renderer/router/routes';
import {
    usePlayerSong,
    usePlayerSpeed,
    usePlayerStatus,
    usePlayerStoreBase,
} from '/@/renderer/store/player.store';
import { usePlayerTimestamp } from '/@/renderer/store/timestamp.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Icon } from '/@/shared/components/icon/icon';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Select } from '/@/shared/components/select/select';
import { LibraryItem, type SynchronizedLyrics } from '/@/shared/types/domain-types';
import { PlayerStatus } from '/@/shared/types/types';

const useStage = create<{ open: boolean }>(() => ({ open: false }));

export const useStageOpen = () => useStage((s) => s.open);

const PlayContextWatcher = () => {
    const song = usePlayerSong();
    const last = useRef<string | undefined>(undefined);
    useEffect(() => {
        const before = last.current;
        last.current = song?._uniqueId;
        if (!song) return;
        const queue = usePlayerStoreBase.getState().getQueue().items;
        if (before && queue.some((q) => q._uniqueId === before)) return; // same queue as before
        // a playlist was just started from somewhere (its card, the sidebar, a right-click...)
        if (Date.now() - usePlayContext.getState().at < 15000) return;
        const match = window.location.hash.match(/\/playlists\/([^/?#]+)/);
        usePlayContext.setState({ at: 0, playlistId: match ? decodeURIComponent(match[1]) : null });
    }, [song]);
    return null;
};

export const toggleStage = (open = !useStage.getState().open) => {
    useStage.setState({ open });
    document.documentElement.classList.toggle('sour-stage-open', open);
};

const LRC = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?]/g;

// lyrics from the shared lyrics query, as timed lines (or plain lines without times)
const hapticsOn = () => usePhoneStore.getState().settings.haptics && isNativeApp();

export const toLines = (lyrics: unknown): { lines: Line[]; synced: boolean } => {
    if (Array.isArray(lyrics)) {
        const lines = (lyrics as SynchronizedLyrics)
            .filter((l) => typeof l?.startMs === 'number')
            .map((l) => ({
                cues: l.cueLines?.flatMap((c) =>
                    (c.words ?? []).map((w) => ({
                        endMs: w.endMs,
                        startMs: w.startMs,
                        text: w.text,
                    })),
                ),
                startMs: l.startMs,
                text: l.text,
            }));
        return { lines, synced: true };
    }
    if (typeof lyrics !== 'string' || !lyrics.trim()) return { lines: [], synced: false };
    const timed: Line[] = [];
    for (const raw of lyrics.split(/\r?\n/)) {
        const stamps = [...raw.matchAll(LRC)];
        const text = raw.replace(LRC, '').trim();
        for (const m of stamps) {
            const ms =
                Number(m[1]) * 60000 + Number(m[2]) * 1000 + Number((m[3] || '0').padEnd(3, '0'));
            timed.push({ startMs: ms, text });
        }
    }
    if (timed.length) return { lines: timed.sort((a, b) => a.startMs - b.startMs), synced: true };
    return {
        lines: lyrics
            .split(/\r?\n/)
            .filter((l) => l.trim())
            .map((text) => ({ startMs: -1, text })),
        synced: false,
    };
};

const fmt = (s: number) => {
    const v = Math.max(0, Math.floor(s));
    return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`;
};

const StageView = () => {
    const song = usePlayerSong();
    const status = usePlayerStatus();
    const timestamp = usePlayerTimestamp();
    const speed = usePlayerSpeed();
    const look = useSourStore((s) => s.look);
    const setLook = useSourStore((s) => s.setLook);
    const me = useSourStore((s) => s.me);
    const myProfile = useMyProfile().data;
    const perks = myProfile?.perks ?? [];
    // a perk look someone doesn't have (once their profile is known) shows as the lemon bars
    const perkStyle = VISUALIZER_STYLES.find((v) => v.id === look.visualizer)?.perk;
    const visualizer =
        perkStyle && myProfile && !perks.includes(perkStyle) ? 'bars' : look.visualizer;
    const profiles = useSourProfiles().data ?? [];
    const hermes = useHermesUrl();
    const group = useGroupPlayStore((s) => s.state);
    const loop = useLoop();
    const [flipped, setFlipped] = useState(false);
    // phones: the Stage is the full screen player too (its controls, and lyrics that can be hidden)
    const phone = useIsMobile();
    const [phoneLyrics, setPhoneLyrics] = useState(true);
    const touch = useRef<null | { x: number; y: number }>(null);
    const controls = usePlayer();
    const [soulPlay, setSoulPlay] = useState(false);
    // playing from a playlist with its own background picture (playlist Theme): that picture is
    // the Stage's backdrop instead of the blurred cover
    const contextPlaylist = usePlayContext((s) => s.playlistId);
    const themes = useQuery({
        enabled: !!hermes && !!contextPlaylist,
        queryFn: async () => {
            const res = await fetch(`${hermes}/api/playlist-themes`);
            const json = res.ok ? await res.json() : [];
            return (Array.isArray(json) ? json : []) as { id: string; image: number }[];
        },
        queryKey: ['sour-playlist-themes', hermes],
        retry: false,
        staleTime: 60000,
    }).data;
    const themed = themes?.find((t) => t.id === contextPlaylist && t.image);
    const backdrop = themed
        ? `${hermes}/api/playlist-themes/${encodeURIComponent(themed.id)}/image?v=${themed.image}`
        : null;
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const coverWrap = useRef<HTMLDivElement>(null);
    const lyricsBox = useRef<HTMLDivElement>(null);
    const playing = status === PlayerStatus.PLAYING;

    const cover = useItemImageUrl({
        id: song?.imageId || undefined,
        itemType: LibraryItem.SONG,
        type: 'fullScreenPlayer',
    });
    const { background } = useFastAverageColor({
        algorithm: 'dominant',
        src: cover || null,
        srcLoaded: true,
    });
    const color = background || 'rgb(60, 50, 20)';

    const { data } = useQuery(
        lyricsQueries.songLyrics(
            {
                options: { enabled: !!song?.id },
                query: { songId: song?.id || '' },
                serverId: song?._serverId || '',
            },
            song,
        ),
    );
    const sourness = useQuery({
        enabled: !!hermes && !!song?.id,
        queryFn: () => socialApi.sourness(hermes, song?.id || ''),
        queryKey: ['sour-sourness', hermes, song?.id],
        retry: false,
    }).data;
    const notes = useQuery({
        enabled: !!hermes && !!song?.id,
        queryFn: () => socialApi.notes(hermes, song?.id || ''),
        queryKey: ['sour-song-notes', hermes, song?.id],
        retry: false,
    }).data;
    const selected = data?.selected as null | undefined | { lyrics?: unknown };
    const { lines, synced } = useMemo(() => toLines(selected?.lyrics), [selected]);
    const offset = data?.selectedOffsetMs ?? 0;
    const nowMs = timestamp * 1000 + offset;
    let current = -1;
    if (synced)
        for (let i = 0; i < lines.length; i++) if (lines[i].startMs <= nowMs + 150) current = i;

    useEffect(() => {
        setFlipped(false);
    }, [song?._uniqueId]);

    // a new song: the old cover peels off the new one (not when it's the same cover)
    const [peel, setPeel] = useState<null | { id: string; src: string }>(null);
    const shown = useRef<{ id?: string; src?: null | string }>({});
    useEffect(() => {
        const before = shown.current;
        shown.current = { id: song?._uniqueId, src: cover };
        if (!song || !before.id || before.id === song._uniqueId) return;
        if (before.src && before.src !== cover && !look.stageVinyl && !look.reducedMotion) {
            setPeel({ id: song._uniqueId, src: before.src });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [song?._uniqueId, cover]);

    // keep the sung line in the middle
    useEffect(() => {
        const box = lyricsBox.current;
        const el = box?.querySelector<HTMLElement>(`[data-line="${current}"]`);
        if (box && el)
            box.scrollTo({
                behavior: 'smooth',
                top: el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2,
            });
    }, [current]);

    // the cover gives a little bump on every beat
    useLevelSource();
    useEffect(() => {
        const levels = makeLevels();
        let frame = 0;
        let pulse = 0;
        let lastBuzz = 0;
        const tick = (now: number) => {
            frame = requestAnimationFrame(tick);
            readLevels(levels, now);
            pulse = levels.beat ? 1 : pulse * 0.88;
            // phones: feel the beat (Settings > Phone)
            if (levels.beat && hapticsOn() && now - lastBuzz > 220) {
                lastBuzz = now;
                navigator.vibrate?.(18);
            }
            if (coverWrap.current) coverWrap.current.style.setProperty('--beat', String(pulse));
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') toggleStage(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const duration = (song?.duration || 0) / 1000;
    const remaining = duration - timestamp;
    const player = usePlayerStoreBase.getState();
    const queue = player.getQueue().items;
    const at = queue.findIndex((x) => x._uniqueId === song?._uniqueId);
    const next = at >= 0 ? queue[at + 1] : undefined;
    const groupSong = group && !group.ended ? group.queue[group.index] : undefined;
    const addedBy = groupSong && groupSong.id === song?.id ? groupSong.by : null;
    const why = getReason(song?.id) ?? (addedBy ? `Added by ${addedBy} in ${group?.name}` : null);
    const sameSong = profiles.filter(
        (p) => p.id !== me?.id && p.online && p.listening?.id === song?.id,
    );
    const fans = profiles
        .map((p) => ({ p, plays: p.stats?.topSongs.find((t) => t.id === song?.id)?.plays ?? 0 }))
        .filter((x) => x.plays > 0)
        .sort((a, b) => b.plays - a.plays)
        .slice(0, 5);
    const orbit = (
        group && !group.ended
            ? group.members.map((m) => ({ id: m.profile, name: m.name }))
            : sameSong.map((p) => ({ id: p.id, name: p.name }))
    ).map((m) => {
        const prof = profiles.find((p) => p.id === m.id);
        return {
            color: `hsl(${hue(m.name)} 60% 50%)`,
            image: prof ? avatarUrl(hermes, prof) : null,
            name: m.name,
        };
    });
    const speedId = SPEEDS.find((s) => Math.abs(s.speed - speed) < 0.01)?.id ?? 'normal';

    return (
        <div
            className={clsx(styles.stage, {
                [styles.phone]: phone,
                [styles.phoneNoLyrics]: phone && !phoneLyrics,
            })}
            style={{ '--stage-color': color } as CSSProperties}
        >
            {backdrop ? (
                <div
                    className={styles.backdrop}
                    style={{ backgroundImage: `url("${backdrop}")` }}
                />
            ) : (
                cover && (
                    <div className={styles.blur} style={{ backgroundImage: `url("${cover}")` }} />
                )
            )}
            <Scene className={styles.scene} scene={look.stageScene} />
            <div className={styles.toolbar}>
                {phone && (
                    <button
                        aria-label="Close the Sour Stage"
                        className={styles.tool}
                        onClick={() => toggleStage(false)}
                        type="button"
                    >
                        <Icon icon="arrowDownS" />
                    </button>
                )}
                <Select
                    aria-label="Scene"
                    data={SCENES.map((s) => ({ label: s.label, value: s.id }))}
                    onChange={(v) => v && setLook({ stageScene: v as SourLook['stageScene'] })}
                    size={phone ? 'xs' : 'sm'}
                    value={look.stageScene}
                    w={phone ? 130 : 160}
                />
                <Select
                    aria-label="Visualizer"
                    data={VISUALIZER_STYLES.filter((v) => !v.perk || perks.includes(v.perk)).map(
                        (v) => ({ label: v.label, value: v.id }),
                    )}
                    onChange={(v) => v && setLook({ visualizer: v as SourLook['visualizer'] })}
                    size={phone ? 'xs' : 'sm'}
                    value={visualizer}
                    w={phone ? 130 : 150}
                />
                <SegmentedControl
                    data={[
                        { label: 'Centred', value: 'centered' },
                        { label: 'Huge', value: 'huge' },
                        { label: 'Karaoke', value: 'karaoke' },
                    ]}
                    onChange={(v) => setLook({ lyricStyle: v as SourLook['lyricStyle'] })}
                    size="xs"
                    value={look.lyricStyle}
                />
                {visualizer === 'soul' && (
                    <button
                        className={clsx(styles.tool, { [styles.on]: soulPlay })}
                        onClick={() => setSoulPlay((on) => !on)}
                        title={
                            soulPlay
                                ? 'Let the SOUL dodge by itself'
                                : 'Play as the SOUL (arrow keys or WASD; hits do nothing)'
                        }
                        type="button"
                    >
                        <Icon icon="favorite" />
                    </button>
                )}
                <button
                    className={clsx(styles.tool, { [styles.on]: look.stageVinyl })}
                    onClick={() => setLook({ stageVinyl: !look.stageVinyl })}
                    title="Spinning vinyl"
                    type="button"
                >
                    <Icon icon="disc" />
                </button>
                {phone && <SleepTimerButton />}
                {!phone && (
                    <button
                        aria-label="Close the Sour Stage"
                        className={styles.tool}
                        onClick={() => toggleStage(false)}
                        title="Close (Esc)"
                        type="button"
                    >
                        <Icon icon="x" />
                    </button>
                )}
            </div>

            <div className={styles.main}>
                <div className={styles.left}>
                    <div
                        className={styles.coverWrap}
                        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
                        onMouseMove={(e) => {
                            const r = e.currentTarget.getBoundingClientRect();
                            setTilt({
                                x: ((e.clientX - r.left) / r.width - 0.5) * 12,
                                y: ((e.clientY - r.top) / r.height - 0.5) * -12,
                            });
                        }}
                        // phones: swipe the cover left/right to skip, down to close, up for the queue
                        onTouchEnd={(e) => {
                            if (!phone || !touch.current) return;
                            const t = e.changedTouches[0];
                            const dx = t.clientX - touch.current.x;
                            const dy = t.clientY - touch.current.y;
                            touch.current = null;
                            if (Math.max(Math.abs(dx), Math.abs(dy)) < 50) return;
                            if (Math.abs(dx) > Math.abs(dy)) {
                                if (dx < 0) controls.mediaNext(false);
                                else controls.mediaPrevious(false);
                            } else if (dy > 0) toggleStage(false);
                            else {
                                toggleStage(false);
                                window.location.hash = AppRoute.NOW_PLAYING;
                            }
                        }}
                        onTouchStart={(e) => {
                            touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                        }}
                        ref={coverWrap}
                    >
                        <button
                            aria-label={flipped ? 'Show the cover' : 'Show the song details'}
                            className={clsx(styles.card, { [styles.flipped]: flipped })}
                            onClick={() => setFlipped((f) => !f)}
                            style={
                                look.stageVinyl || flipped
                                    ? undefined
                                    : { transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)` }
                            }
                            type="button"
                        >
                            <div
                                className={clsx(styles.front, {
                                    [styles.spinning]: look.stageVinyl && playing,
                                    [styles.vinyl]: look.stageVinyl,
                                })}
                            >
                                {cover ? (
                                    <img alt="" src={cover} />
                                ) : (
                                    <Icon icon="itemSong" size="xl" />
                                )}
                                {look.stageVinyl && <span className={styles.hole} />}
                            </div>
                            {peel && peel.id === song?._uniqueId && !flipped && (
                                <PeelOff
                                    key={peel.id}
                                    onDone={() => setPeel(null)}
                                    src={peel.src}
                                />
                            )}
                            <div className={styles.back}>
                                <div className={styles.backTitle}>{song?.name}</div>
                                <div>{song?.artistName}</div>
                                <div className={styles.muted}>{song?.album}</div>
                                <dl className={styles.facts}>
                                    {!!song?.releaseYear && (
                                        <>
                                            <dt>Year</dt>
                                            <dd>{song.releaseYear}</dd>
                                        </>
                                    )}
                                    {!!song?.trackNumber && (
                                        <>
                                            <dt>Track</dt>
                                            <dd>
                                                {song.trackNumber}
                                                {song.discNumber > 1
                                                    ? ` (disc ${song.discNumber})`
                                                    : ''}
                                            </dd>
                                        </>
                                    )}
                                    {!!song?.genres?.length && (
                                        <>
                                            <dt>Genre</dt>
                                            <dd>{song.genres.map((g) => g.name).join(', ')}</dd>
                                        </>
                                    )}
                                    {!!song?.bpm && (
                                        <>
                                            <dt>Tempo</dt>
                                            <dd>{song.bpm} bpm</dd>
                                        </>
                                    )}
                                    <dt>Your plays</dt>
                                    <dd>{song?.playCount ? song.playCount : 'New to you'}</dd>
                                    {sourness && sourness.score !== null && (
                                        <>
                                            <dt>Sourness</dt>
                                            <dd title="How often the group skips it on the radio">
                                                {sourness.score}%{' '}
                                                {sourness.score < 15
                                                    ? '(loved)'
                                                    : sourness.score > 50
                                                      ? '(often skipped)'
                                                      : ''}
                                            </dd>
                                        </>
                                    )}
                                    {addedBy && (
                                        <>
                                            <dt>Added by</dt>
                                            <dd>{addedBy}</dd>
                                        </>
                                    )}
                                </dl>
                                {fans.length > 0 && (
                                    <div className={styles.fans}>
                                        Friends who play it a lot:{' '}
                                        {fans.map((f) => `${f.p.name} (${f.plays})`).join(', ')}
                                    </div>
                                )}
                                {!!notes?.length && (
                                    <div className={styles.fans}>
                                        {notes.slice(0, 3).map((n) => (
                                            <div key={n.id}>
                                                📌 <b>{n.fromName}:</b> {n.text}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className={styles.muted}>Click to flip back</div>
                            </div>
                        </button>
                    </div>
                    <div className={styles.titles}>
                        <div className={styles.title}>{song?.name ?? 'Nothing playing'}</div>
                        <div className={styles.artist}>{song?.artistName}</div>
                        {why && <div className={styles.why}>{why}</div>}
                    </div>
                    {phone && (
                        <div className={styles.phoneControls}>
                            <MobileFullscreenPlayerProgress currentSong={song} />
                            <MobileFullscreenPlayerControls currentSong={song} />
                        </div>
                    )}
                    <div className={styles.loopRow}>
                        <SegmentedControl
                            data={SPEEDS.map((s) => ({ label: s.label, value: s.id }))}
                            onChange={setSpeedPreset}
                            size="xs"
                            value={speedId}
                        />
                        <button
                            className={clsx(styles.tool, { [styles.on]: loop.a !== null })}
                            onClick={() => setLoopPoint('a')}
                            title="Loop from here (A)"
                            type="button"
                        >
                            A
                        </button>
                        <button
                            className={clsx(styles.tool, { [styles.on]: loop.b !== null })}
                            onClick={() => setLoopPoint('b')}
                            title="Loop until here (B)"
                            type="button"
                        >
                            B
                        </button>
                        {(loop.a !== null || loop.b !== null) && (
                            <button
                                className={styles.tool}
                                onClick={clearLoop}
                                title="Stop looping"
                                type="button"
                            >
                                <Icon icon="x" />
                            </button>
                        )}
                        {loop.a !== null && (
                            <span className={styles.muted}>
                                {fmt(loop.a)} {loop.b !== null ? `- ${fmt(loop.b)}` : '- pick B'}
                            </span>
                        )}
                    </div>
                </div>

                <div className={styles.lyricsColumn}>
                    <LyricsTools
                        karaoke={look.lyricStyle === 'karaoke'}
                        offsetMs={offset}
                        song={song}
                    />
                    <div className={clsx(styles.lyrics, styles[look.lyricStyle])} ref={lyricsBox}>
                        {lines.length === 0 && (
                            <div className={styles.noLyrics}>No lyrics for this song</div>
                        )}
                        {look.lyricStyle === 'huge' && synced ? (
                            <div className={styles.hugeLine}>
                                <KaraokeLine
                                    line={lines[Math.max(0, current)] ?? { startMs: 0, text: '' }}
                                    next={lines[current + 1]}
                                    offsetMs={offset}
                                />
                            </div>
                        ) : (
                            lines.map((line, i) => (
                                <div
                                    className={clsx(styles.line, {
                                        [styles.current]: i === current,
                                        [styles.past]: synced && i < current,
                                    })}
                                    data-line={i}
                                    key={`${i}-${line.startMs}`}
                                >
                                    {synced && i === current ? (
                                        <KaraokeLine
                                            line={line}
                                            next={lines[i + 1]}
                                            offsetMs={offset}
                                        />
                                    ) : (
                                        line.text || '♪'
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.bottom}>
                <div
                    className={clsx(styles.viz, {
                        [styles.vizTall]: visualizer === 'soul',
                    })}
                >
                    <SourVisualizer
                        colors={[color]}
                        coverUrl={cover}
                        people={orbit}
                        soulPlay={soulPlay}
                        style={visualizer}
                    />
                </div>
                {phone && (
                    <MobileFullscreenPlayerBottomControls
                        isLyricsActive={phoneLyrics}
                        isQueueActive={false}
                        onToggleContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!song) return;
                            ContextMenuController.call({
                                cmd: { items: [song], type: LibraryItem.SONG },
                                event: e,
                            });
                        }}
                        onToggleLyrics={() => setPhoneLyrics((on) => !on)}
                        onToggleQueue={() => {
                            toggleStage(false);
                            window.location.hash = AppRoute.NOW_PLAYING;
                        }}
                    />
                )}
                <div className={styles.info}>
                    {sameSong.length > 0 && (
                        <span className={styles.friends}>
                            {sameSong.slice(0, 5).map((p) => (
                                <button
                                    className={styles.friend}
                                    key={p.id}
                                    onClick={() => openProfile(p)}
                                    title={`${p.name} is playing this too`}
                                    type="button"
                                >
                                    <ProfileAvatar profile={p} size={26} />
                                </button>
                            ))}
                            <span className={styles.muted}>also listening</span>
                        </span>
                    )}
                    {next && remaining > 0 && remaining <= 15 && (
                        <span className={styles.countdown}>
                            Next: {next.name} in {fmt(remaining)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export const SourStage = () => {
    const open = useStage((s) => s.open);
    useEffect(() => {
        restoreKaraokeVolume(); // in case the app was closed in the middle of karaoke
    }, []);
    return (
        <>
            <PlayContextWatcher />
            {open && <StageView />}
        </>
    );
};

export const SourStageButton = () => (
    <ActionIcon
        icon="sparkles"
        iconProps={{ size: 'lg' }}
        onClick={(e) => {
            e.stopPropagation();
            toggleStage();
        }}
        size="sm"
        tooltip={{ label: 'Sour Stage: full screen now playing (Ctrl+Alt+V)', openDelay: 0 }}
        variant="subtle"
    />
);
