import {
    type GroupControl,
    type GroupListing,
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
    create: (base: string, name: string, user: string, profile: null | string) =>
        post<Created>(`${base}/api/group/create`, { name, profile, user }),
    end: (base: string, code: string, hostKey: string) =>
        post<{ ok: boolean }>(`${base}/api/group/${code}/end`, { hostKey }),
    // Sour Radio: random songs from this computer's library when it runs low
    fill: (base: string, code: string, member: string, songs: GroupSong[]) =>
        post<{ added: number }>(`${base}/api/group/${code}/fill`, { member, songs }),
    join: (base: string, code: string, user: string, profile: null | string) =>
        post<Joined>(`${base}/api/group/${code}/join`, { profile, user }),
    kick: (base: string, code: string, hostKey: string, target: string) =>
        post<{ ok: boolean }>(`${base}/api/group/${code}/kick`, { hostKey, target }),
    leave: (base: string, code: string, member: string) =>
        post<{ ok: boolean }>(`${base}/api/group/${code}/leave`, { member }),
    // groups that are open to join (the host can hide theirs)
    list: async (base: string) => {
        const res = await fetch(`${base}/api/group/list`);
        if (!res.ok) throw new Error(`Hermes Music returned ${res.status}`);
        return (await res.json()) as GroupListing[];
    },
    // change your picture while in a group
    profile: (
        base: string,
        code: string,
        who: { hostKey?: null | string; member?: null | string },
        avatar: null | string,
    ) => post<{ ok: boolean }>(`${base}/api/group/${code}/profile`, { avatar, ...who }),
    report: (base: string, code: string, body: Record<string, unknown>) =>
        post<{ ok: boolean }>(`${base}/api/group/${code}/report`, body),
    settings: (
        base: string,
        code: string,
        hostKey: string,
        changes: { guestControl?: boolean; listed?: boolean },
    ) => post<{ ok: boolean }>(`${base}/api/group/${code}/settings`, { hostKey, ...changes }),
};
