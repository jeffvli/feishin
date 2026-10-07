import {
    type GroupControl,
    type GroupSong,
    type GroupState,
} from '/@/renderer/features/group-play/store/group-play.store';
import { type Song } from '/@/shared/types/domain-types';

interface Created {
    code: string;
    hostKey: string;
    state: GroupState;
}

interface Joined {
    member: string;
    state: GroupState;
}

const post = async <T>(url: string, body: unknown): Promise<T> => {
    const res = await fetch(url, {
        body: JSON.stringify(body),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `Hermes Music returned ${res.status}`);
    return json as T;
};

export const toGroupSong = (song: Song): GroupSong => ({
    album: song.album || '',
    artist: song.artistName,
    duration: song.duration,
    id: song.id,
    imageId: song.imageId ?? null,
    title: song.name,
});

export const groupApi = {
    add: (base: string, code: string, user: string, songs: GroupSong[], member?: null | string) =>
        post<{ added: number }>(`${base}/api/group/${code}/add`, { member, songs, user }),
    // a guest using the group's controls (the host's Feishin carries it out)
    control: (
        base: string,
        code: string,
        member: string,
        cmd: GroupControl,
        target: { index?: number; position?: number; songId?: string } = {},
    ) => post<{ ok: boolean }>(`${base}/api/group/${code}/control`, { cmd, member, ...target }),
    create: (base: string, name: string, user: string) =>
        post<Created>(`${base}/api/group/create`, { name, user }),
    end: (base: string, code: string, hostKey: string) =>
        post<{ ok: boolean }>(`${base}/api/group/${code}/end`, { hostKey }),
    join: (base: string, code: string, user: string) =>
        post<Joined>(`${base}/api/group/${code}/join`, { user }),
    kick: (base: string, code: string, hostKey: string, target: string) =>
        post<{ ok: boolean }>(`${base}/api/group/${code}/kick`, { hostKey, target }),
    leave: (base: string, code: string, member: string) =>
        post<{ ok: boolean }>(`${base}/api/group/${code}/leave`, { member }),
    report: (base: string, code: string, body: Record<string, unknown>) =>
        post<{ ok: boolean }>(`${base}/api/group/${code}/report`, body),
    settings: (base: string, code: string, hostKey: string, guestControl: boolean) =>
        post<{ ok: boolean }>(`${base}/api/group/${code}/settings`, { guestControl, hostKey }),
};
