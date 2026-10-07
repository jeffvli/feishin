import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { groupApi, toGroupSong } from '/@/renderer/features/group-play/api/group-play-api';
import {
    type GroupState,
    useGroupPlayStore,
} from '/@/renderer/features/group-play/store/group-play.store';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { getSongById } from '/@/renderer/features/player/utils';
import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import { useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { useCurrentServer } from '/@/renderer/store';
import { addToQueueByData, usePlayerStoreBase } from '/@/renderer/store/player.store';
import { useTimestampStoreBase } from '/@/renderer/store/timestamp.store';
import { toast } from '/@/shared/components/toast/toast';
import { Played } from '/@/shared/types/domain-types';
import { Play, PlayerStatus } from '/@/shared/types/types';

// seconds the group's song has played, as of now
const groupPosition = (state: GroupState, clockOffset: number) =>
    state.position + (state.playing ? (Date.now() + clockOffset - state.updatedAt) / 1000 : 0);

// Keeps this Feishin in step with a Group Play session (hosted by Hermes Music):
// members follow the host's song and position; the host reports its player, adds members' songs and
// carries out what they do with the group's controls.
export const GroupPlaySync = () => {
    const url = useHermesUrl();
    const code = useGroupPlayStore((state) => state.code);
    const role = useGroupPlayStore((state) => state.role);
    const member = useGroupPlayStore((state) => state.member);
    const requests = useGroupPlayStore((state) => state.state?.requests);
    const commands = useGroupPlayStore((state) => state.state?.commands);
    const radioNeedsSongs = useGroupPlayStore(
        (state) => !!state.state?.radio && !!state.state?.needSongs,
    );
    const queryClient = useQueryClient();
    const serverId = useCurrentServer()?.id;
    const loading = useRef<null | string>(null);
    const failed = useRef<null | string>(null);
    const applying = useRef(new Set<string>());
    const applied = useRef<string[]>([]);
    const adding = useRef<Promise<unknown>>(Promise.resolve());

    // closing Sour Player leaves the group straight away (otherwise Hermes Music only notices
    // minutes later and you'd show up twice when you join again); a host closing ends the group
    useEffect(() => {
        if (!url || !code) return undefined;
        const onClose = () => {
            const { hostKey } = useGroupPlayStore.getState();
            if (role === 'host' && hostKey) {
                navigator.sendBeacon(`${url}/api/group/${code}/end`, JSON.stringify({ hostKey }));
            } else if (member) {
                navigator.sendBeacon(`${url}/api/group/${code}/leave`, JSON.stringify({ member }));
            }
        };
        window.addEventListener('beforeunload', onClose);
        return () => window.removeEventListener('beforeunload', onClose);
    }, [code, member, role, url]);

    // older entries of you in this group (from a connection Hermes Music hasn't noticed closing)
    // are removed, so you count once (votes to skip need half the real listeners)
    const members = useGroupPlayStore((state) => state.state?.members);
    const myProfile = useSourStore((state) => state.me?.id);
    const removedGhosts = useRef(new Set<string>());
    useEffect(() => {
        if (!url || !code || !myProfile || !members) return;
        members
            .filter((m) => m.profile === myProfile && m.id !== member)
            .filter((m) => !removedGhosts.current.has(m.id))
            .forEach((ghost) => {
                removedGhosts.current.add(ghost.id);
                groupApi.leave(url, code, ghost.id).catch(() => {});
            });
    }, [code, member, members, myProfile, url]);

    // live group state
    useEffect(() => {
        if (!url || !code) return;
        const query = member ? `?member=${member}` : '';
        const events = new EventSource(`${url}/api/group/${code}/events${query}`);
        events.addEventListener('state', (event) => {
            const state = JSON.parse((event as MessageEvent).data) as GroupState;
            const { actions } = useGroupPlayStore.getState();
            if (state.ended) {
                toast.info({ message: 'Group Play ended' });
                actions.leave();
                return;
            }
            actions.setState(state);
        });
        events.addEventListener('kicked', () => {
            toast.info({ message: 'The host removed you from the group' });
            useGroupPlayStore.getState().actions.leave();
        });
        return () => events.close();
    }, [code, member, url]);

    // member: play what the host plays, where the host is (local skips snap back)
    useEffect(() => {
        if (role !== 'member' || !serverId) return;
        const follow = () => {
            const { clockOffset, state } = useGroupPlayStore.getState();
            const target = state?.queue[state.index];
            if (!state || !target) return;
            const player = usePlayerStoreBase.getState();
            if (player.getCurrentSong()?.id !== target.id) {
                if (loading.current === target.id || failed.current === target.id) return;
                loading.current = target.id;
                getSongById({ id: target.id, queryClient, serverId })
                    .then((res) => {
                        const latest = useGroupPlayStore.getState().state ?? state;
                        const store = usePlayerStoreBase.getState();
                        store.setQueue(res.items, 0, groupPosition(latest, clockOffset));
                        if (!latest.playing) store.mediaPause();
                    })
                    .catch(() => {
                        failed.current = target.id;
                        toast.error({ message: `${target.title} isn't on your music server` });
                    })
                    .finally(() => {
                        loading.current = null;
                    });
                return;
            }
            const playing = player.player.status === PlayerStatus.PLAYING;
            if (state.playing && !playing) player.mediaPlay();
            if (!state.playing && playing) player.mediaPause();
            const expected = groupPosition(state, clockOffset);
            const timestamp = useTimestampStoreBase.getState().timestamp;
            if (Math.abs(timestamp - expected) > 2.5) player.mediaSeekToTimestamp(expected);
        };
        const timer = setInterval(follow, 1000);
        return () => clearInterval(timer);
    }, [queryClient, role, serverId]);

    // host: report queue, song, position and play/pause when they change
    useEffect(() => {
        if (role !== 'host' || !url || !code) return;
        let lastIds = '';
        let last = { at: 0, index: -1, playing: false, position: 0 };
        const report = () => {
            const player = usePlayerStoreBase.getState();
            const items = player.getQueue().items;
            const currentId = player.getCurrentSong()?._uniqueId;
            const index = Math.max(
                0,
                items.findIndex((item) => item._uniqueId === currentId),
            );
            const playing = player.player.status === PlayerStatus.PLAYING;
            const position = useTimestampStoreBase.getState().timestamp;
            const ids = items.map((item) => item.id).join(',');
            const predicted = last.position + (last.playing ? (Date.now() - last.at) / 1000 : 0);
            const changed =
                ids !== lastIds ||
                index !== last.index ||
                playing !== last.playing ||
                Math.abs(position - predicted) > 1.5 ||
                Date.now() - last.at > 5000 ||
                applied.current.length > 0;
            if (!changed) return;
            const { hostKey } = useGroupPlayStore.getState();
            const body: Record<string, unknown> = { hostKey, index, playing, position };
            if (ids !== lastIds) body.queue = items.map(toGroupSong);
            if (applied.current.length) body.applied = applied.current.splice(0);
            last = { at: Date.now(), index, playing, position };
            groupApi
                .report(url, code, body)
                .then(() => {
                    lastIds = ids;
                })
                .catch(() => {});
        };
        report();
        const timer = setInterval(report, 1000);
        return () => clearInterval(timer);
    }, [code, role, url]);

    // host: add the songs members asked for to the end of the queue
    useEffect(() => {
        if (role !== 'host' || !serverId || !requests?.length) return;
        requests
            .filter((request) => !applying.current.has(request.rid))
            .forEach((request) => {
                applying.current.add(request.rid);
                // one at a time, in order, so the first song into an empty group is the one that plays
                adding.current = adding.current
                    .then(() => getSongById({ id: request.song.id, queryClient, serverId }))
                    .then((res) => {
                        const empty = usePlayerStoreBase.getState().getQueue().items.length === 0;
                        return addToQueueByData(empty ? Play.NOW : Play.LAST, res.items);
                    })
                    .then(() =>
                        toast.info({ message: `${request.by} added ${request.song.title}` }),
                    )
                    .catch(() => toast.error({ message: `Couldn't add ${request.song.title}` }))
                    .finally(() => applied.current.push(request.rid));
            });
    }, [queryClient, requests, role, serverId]);

    // Sour Radio: when it's running low, send random songs from this library
    useEffect(() => {
        if (!radioNeedsSongs || !url || !code || !member || !serverId) return undefined;
        let stopped = false;
        const fill = () =>
            queryClient
                .fetchQuery({
                    ...songsQueries.random({ query: { limit: 10, played: Played.All }, serverId }),
                    queryKey: ['group-radio-fill', Date.now()],
                })
                .then((res) => {
                    if (stopped) return undefined;
                    return groupApi.fill(url, code, member, res.items.map(toGroupSong));
                })
                .catch(() => {});
        const first = setTimeout(fill, Math.random() * 3000); // so listeners don't all send at once
        const retry = setInterval(fill, 20000);
        return () => {
            stopped = true;
            clearTimeout(first);
            clearInterval(retry);
        };
    }, [code, member, queryClient, radioNeedsSongs, serverId, url]);

    // host: carry out what guests did with the group's controls
    useEffect(() => {
        if (role !== 'host' || !commands?.length) return;
        commands
            .filter((command) => !applying.current.has(command.cid))
            .forEach((command) => {
                applying.current.add(command.cid);
                const player = usePlayerStoreBase.getState();
                const item = player.getQueue().items[command.index];
                const sameSong = !!item && item.id === command.songId;
                switch (command.cmd) {
                    case 'next':
                        player.mediaNext(false);
                        toast.info({ message: `${command.by} skipped` });
                        break;
                    case 'pause':
                        player.mediaPause();
                        break;
                    case 'play':
                        player.mediaPlay();
                        break;
                    case 'playIndex':
                        if (sameSong) player.mediaPlayByIndex(command.index);
                        break;
                    case 'playNext':
                        if (sameSong) player.moveSelectedToNext([item]);
                        break;
                    case 'previous':
                        player.mediaPrevious(false);
                        break;
                    case 'remove':
                        if (sameSong) {
                            player.clearSelected([item]);
                            toast.info({ message: `${command.by} removed ${item.name}` });
                        }
                        break;
                    case 'seek':
                        player.mediaSeekToTimestamp(command.position);
                        break;
                }
                applied.current.push(command.cid);
            });
    }, [commands, role]);

    return null;
};
