import type { RefObject } from 'react';

import { useEffect, useImperativeHandle, useRef, useState } from 'react';

import { useJukeboxControl } from '/@/renderer/features/player/audio-player/hooks/use-jukebox-control';
import { AudioPlayer } from '/@/renderer/features/player/audio-player/types';
import {
    JukeboxControlAction,
    JukeboxControlQuery,
    JukeboxControlResponse,
    PlayerData,
} from '/@/shared/types/domain-types';
import { PlayerStatus } from '/@/shared/types/types';

export interface JukeboxPlayerEngineHandle extends AudioPlayer {}

export type JukeboxServerState = {
    gain: number;
    nextTrackId: null | string;
    playing: boolean;
    position: number;
    trackId: null | string;
};

type JukeboxCallApi = (
    action: JukeboxControlAction,
    queryParams?: Omit<JukeboxControlQuery, 'action'>,
) => Promise<JukeboxControlResponse>;

interface JukeboxPlayerEngineProps {
    currentTrackId: null | string;
    enabled: boolean;
    isMuted: boolean;
    nextTrackId: null | string;
    onEnded: () => PlayerData;
    onServerStateSynced?: (state: JukeboxServerState) => void;
    onTick: (positionSeconds: number) => void;
    playerRef: RefObject<JukeboxPlayerEngineHandle | null>;
    playerStatus: PlayerStatus;
    serverId: string;
    volume: number;
}

type JukeboxQueueRefs = {
    lastCurrentTrackIdRef: RefObject<null | string>;
    lastNextTrackIdRef: RefObject<null | string>;
    lastServerIndexRef: RefObject<number>;
};

const TRACK_SETUP_DELAY_MS = 300;

const buildQueueIds = (currentId: string, nextId?: null | string): string | string[] => {
    if (nextId) {
        return [currentId, nextId];
    }

    return currentId;
};

const getPlaylistTrackIds = (
    playlist: NonNullable<JukeboxControlResponse>['jukeboxPlaylist'],
): { currentTrackId: null | string; nextTrackId: null | string } => {
    if (!playlist?.entry?.length) {
        return { currentTrackId: null, nextTrackId: null };
    }

    const currentIndex = playlist.currentIndex ?? 0;
    const currentTrackId = playlist.entry[currentIndex]?.id ?? null;
    const nextTrackId = playlist.entry[currentIndex + 1]?.id ?? null;

    return { currentTrackId, nextTrackId };
};

const replaceJukeboxQueue = async (
    callApi: JukeboxCallApi,
    refs: JukeboxQueueRefs,
    currentId: null | string,
    nextId: null | string,
    shouldStart: boolean,
) => {
    if (!currentId) {
        await callApi('clear');
        refs.lastCurrentTrackIdRef.current = null;
        refs.lastNextTrackIdRef.current = null;
        refs.lastServerIndexRef.current = -1;
        return;
    }

    await callApi('set', { id: buildQueueIds(currentId, nextId) });
    await callApi('skip', { index: 0, offset: 0 });

    if (shouldStart) {
        await callApi('start');
    }

    refs.lastCurrentTrackIdRef.current = currentId;
    refs.lastNextTrackIdRef.current = nextId;
    refs.lastServerIndexRef.current = 0;
};

const setJukeboxQueueNext = async (
    callApi: JukeboxCallApi,
    refs: JukeboxQueueRefs,
    nextId: null | string,
) => {
    const res = await callApi('get');
    const entryCount = res?.jukeboxPlaylist?.entry?.length ?? 0;

    if (entryCount > 1) {
        await callApi('remove', { index: 1 });
    }

    if (nextId) {
        await callApi('add', { id: nextId });
    }

    refs.lastNextTrackIdRef.current = nextId;
};

const handleJukeboxAutoNext = async (
    callApi: JukeboxCallApi,
    refs: JukeboxQueueRefs,
    playerData: PlayerData,
) => {
    await callApi('remove', { index: 0 });

    const newNextId = playerData.nextSong?.id ?? null;
    if (newNextId) {
        await callApi('add', { id: newNextId });
    }

    refs.lastCurrentTrackIdRef.current = playerData.currentSong?.id ?? null;
    refs.lastNextTrackIdRef.current = newNextId;
    refs.lastServerIndexRef.current = 0;
};

export const JukeboxPlayerEngine = (props: JukeboxPlayerEngineProps) => {
    const {
        currentTrackId,
        enabled,
        isMuted,
        nextTrackId,
        onEnded,
        onServerStateSynced,
        onTick,
        playerRef,
        playerStatus,
        serverId,
        volume,
    } = props;

    const pollRef = useRef<NodeJS.Timeout | null>(null);
    const lastPositionRef = useRef<number>(-1);
    const lastCurrentTrackIdRef = useRef<null | string>(null);
    const lastNextTrackIdRef = useRef<null | string>(null);
    const lastServerIndexRef = useRef<number>(-1);
    const isChangingTrackRef = useRef<boolean>(false);
    const serverPlayingRef = useRef<boolean>(false);
    const queueRefs: JukeboxQueueRefs = {
        lastCurrentTrackIdRef,
        lastNextTrackIdRef,
        lastServerIndexRef,
    };
    const [gainValue, setGainValue] = useState(volume / 100);
    const [isSyncedFromServer, setIsSyncedFromServer] = useState(false);

    const jukeboxControlMutation = useJukeboxControl();

    const callApi: JukeboxCallApi = async (action, queryParams = {}) => {
        if (!serverId) return null;
        try {
            return await jukeboxControlMutation.mutateAsync({
                apiClientProps: { serverId },
                query: {
                    action,
                    ...queryParams,
                },
            });
        } catch {
            return null;
        }
    };

    // 0. On startup, read existing server jukebox state before pushing local state
    useEffect(() => {
        if (!enabled) {
            return;
        }

        let cancelled = false;

        const syncFromServer = async () => {
            setIsSyncedFromServer(false);

            const res = await callApi('get');
            if (cancelled) {
                return;
            }

            const playlist = res?.jukeboxPlaylist;
            if (!playlist) {
                serverPlayingRef.current = false;
                setIsSyncedFromServer(true);
                return;
            }

            const { currentTrackId: serverTrackId, nextTrackId: serverNextTrackId } =
                getPlaylistTrackIds(playlist);
            const { gain, playing, position } = playlist;

            lastCurrentTrackIdRef.current = serverTrackId;
            lastNextTrackIdRef.current = serverNextTrackId;
            lastServerIndexRef.current = playlist.currentIndex ?? 0;

            if (position !== undefined && position !== null) {
                lastPositionRef.current = position;
            }

            serverPlayingRef.current = playing;

            if (gain !== undefined) {
                setGainValue(gain);
            }

            onServerStateSynced?.({
                gain: gain ?? gainValue,
                nextTrackId: serverNextTrackId,
                playing,
                position: position ?? 0,
                trackId: serverTrackId,
            });

            if (!cancelled) {
                setIsSyncedFromServer(true);
            }
        };

        syncFromServer();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, serverId]);

    // 1. Keep server queue aligned with local current + next songs
    useEffect(() => {
        if (!isSyncedFromServer || isChangingTrackRef.current) {
            return;
        }

        const syncQueue = async () => {
            if (!currentTrackId) {
                if (!serverPlayingRef.current) {
                    await callApi('clear');
                    lastCurrentTrackIdRef.current = null;
                    lastNextTrackIdRef.current = null;
                    lastServerIndexRef.current = -1;
                    lastPositionRef.current = -1;
                }
                return;
            }

            const currentChanged = currentTrackId !== lastCurrentTrackIdRef.current;
            const nextChanged = nextTrackId !== lastNextTrackIdRef.current;

            if (!currentChanged && !nextChanged) {
                return;
            }

            isChangingTrackRef.current = true;

            try {
                if (currentChanged) {
                    await replaceJukeboxQueue(
                        callApi,
                        queueRefs,
                        currentTrackId,
                        nextTrackId,
                        playerStatus === PlayerStatus.PLAYING,
                    );
                    serverPlayingRef.current = playerStatus === PlayerStatus.PLAYING;
                    lastPositionRef.current = -1;
                } else if (nextChanged) {
                    await setJukeboxQueueNext(callApi, queueRefs, nextTrackId);
                }
            } finally {
                setTimeout(() => {
                    isChangingTrackRef.current = false;
                }, TRACK_SETUP_DELAY_MS);
            }
        };

        syncQueue();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTrackId, isSyncedFromServer, nextTrackId, playerStatus]);

    // 2. Play/Pause Matcher
    useEffect(() => {
        if (!isSyncedFromServer || isChangingTrackRef.current) {
            return;
        }

        const shouldPlay = playerStatus === PlayerStatus.PLAYING;
        if (serverPlayingRef.current === shouldPlay) {
            return;
        }

        if (shouldPlay) {
            callApi('start');
        } else {
            callApi('stop');
        }

        serverPlayingRef.current = shouldPlay;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerStatus, isSyncedFromServer]);

    // 3. Audio Level Matcher
    useEffect(() => {
        if (!isSyncedFromServer) {
            return;
        }

        const gain = isMuted ? 0 : gainValue;
        callApi('setGain', { gain });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gainValue, isMuted, isSyncedFromServer]);

    // 4. Position Tick Updates + server-side auto-advance detection
    useEffect(() => {
        if (pollRef.current) clearInterval(pollRef.current);
        if (!isSyncedFromServer || playerStatus !== PlayerStatus.PLAYING) return;

        pollRef.current = setInterval(async () => {
            if (isChangingTrackRef.current) return;

            const res = await callApi('get');
            if (!res?.jukeboxPlaylist) return;

            const playlist = res.jukeboxPlaylist;
            const { playing, position } = playlist;
            const currentIndex = playlist.currentIndex ?? 0;
            const { currentTrackId: serverTrackId } = getPlaylistTrackIds(playlist);

            serverPlayingRef.current = playing;

            const serverAutoAdvanced =
                playing &&
                lastServerIndexRef.current === 0 &&
                currentIndex === 1 &&
                serverTrackId === lastNextTrackIdRef.current;

            if (serverAutoAdvanced) {
                isChangingTrackRef.current = true;
                try {
                    const playerData = onEnded();
                    await handleJukeboxAutoNext(callApi, queueRefs, playerData);
                    lastPositionRef.current = position ?? 0;
                    if (position !== undefined && position !== null) {
                        onTick(position);
                    }
                } finally {
                    isChangingTrackRef.current = false;
                }

                lastServerIndexRef.current = currentIndex;
                return;
            }

            lastServerIndexRef.current = currentIndex;

            if (!playing && lastPositionRef.current > 0) {
                lastPositionRef.current = -1;
                onEnded();
                return;
            }

            if (position !== undefined && position !== null) {
                lastPositionRef.current = position;
                onTick(position);
            }
        }, 1000);

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSyncedFromServer, playerStatus, onEnded, onTick]);

    useImperativeHandle<JukeboxPlayerEngineHandle, JukeboxPlayerEngineHandle>(playerRef, () => ({
        decreaseVolume(by: number) {
            const next = Math.max(0, gainValue - by / 100);
            setGainValue(next);
        },
        increaseVolume(by: number) {
            const next = Math.min(1, gainValue + by / 100);
            setGainValue(next);
        },
        pause() {
            serverPlayingRef.current = false;
            callApi('stop');
        },
        play() {
            serverPlayingRef.current = true;
            callApi('start');
        },
        seekTo(seconds: number) {
            if (isChangingTrackRef.current) return;
            callApi('skip', { index: 0, offset: Math.floor(seconds) });
        },
        setVolume(vol: number) {
            const gain = vol / 100;
            setGainValue(gain);
            callApi('setGain', { gain });
        },
    }));

    return <div id="jukebox-player-engine" style={{ display: 'none' }} />;
};

JukeboxPlayerEngine.displayName = 'JukeboxPlayerEngine';
