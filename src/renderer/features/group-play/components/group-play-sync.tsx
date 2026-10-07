import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { groupApi, toGroupSong } from '/@/renderer/features/group-play/api/group-play-api';
import {
    type GroupState,
    useGroupPlayStore,
} from '/@/renderer/features/group-play/store/group-play.store';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { getSongById } from '/@/renderer/features/player/utils';
import { useCurrentServer } from '/@/renderer/store';
import { addToQueueByData, usePlayerStoreBase } from '/@/renderer/store/player.store';
import { useTimestampStoreBase } from '/@/renderer/store/timestamp.store';
import { toast } from '/@/shared/components/toast/toast';
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
    const queryClient = useQueryClient();
    const serverId = useCurrentServer()?.id;
    const loading = useRef<null | string>(null);
    const failed = useRef<null | string>(null);
    const applying = useRef(new Set<string>());
    const applied = useRef<string[]>([]);

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
                getSongById({ id: request.song.id, queryClient, serverId })
                    .then((res) => addToQueueByData(Play.LAST, res.items))
                    .then(() =>
                        toast.info({ message: `${request.by} added ${request.song.title}` }),
                    )
                    .catch(() => toast.error({ message: `Couldn't add ${request.song.title}` }))
                    .finally(() => applied.current.push(request.rid));
            });
    }, [queryClient, requests, role, serverId]);

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
