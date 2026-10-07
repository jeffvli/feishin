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

type Who = { hostKey?: null | string; member?: null | string };

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
    chat: (base: string, code: string, who: Who, text: string) =>
        post<{ ok: boolean }>(`${base}/api/group/${code}/chat`, { text, ...who }),
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
    guess: (base: string, code: string, member: string, songId: string, name: string) =>
        post<{ ok: boolean }>(`${base}/api/group/${code}/guess`, { member, name, songId }),
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
        const list = await res.json().catch(() => null);
        // a wrong address answers with a web page instead of Hermes Music's list
        if (!Array.isArray(list)) throw new Error("That address doesn't answer like Hermes Music");
        return list as GroupListing[];
    },
    ping: (base: string, code: string, who: Who) =>
        post<{ ok: boolean }>(`${base}/api/group/${code}/ping`, who),
    // change your picture while in a group
    profile: (
        base: string,
        code: string,
        who: { hostKey?: null | string; member?: null | string },
        avatar: null | string,
    ) => post<{ ok: boolean }>(`${base}/api/group/${code}/profile`, { avatar, ...who }),
    react: (base: string, code: string, who: Who, emoji: string) =>
        post<{ ok: boolean }>(`${base}/api/group/${code}/react`, { emoji, ...who }),
    report: (base: string, code: string, body: Record<string, unknown>) =>
        post<{ ok: boolean }>(`${base}/api/group/${code}/report`, body),
    // your own always-on room (one per person)
    room: (base: string, profile: string, key: string, name: string, remove?: boolean) =>
        post<{ code: string; name: string }>(`${base}/api/group/rooms`, { key, name, profile, remove }),
    // book a DJ show on a station (start in ms, length in minutes), or cancel one
    schedule: (
        base: string,
        code: string,
        body: { cancel?: string; key: string; member?: null | string; minutes?: number; profile: string; start?: number },
    ) => post<{ ok: boolean }>(`${base}/api/group/${code}/schedule`, body),
    settings: (
        base: string,
        code: string,
        hostKey: string,
        changes: { djRotation?: boolean; guestControl?: boolean; listed?: boolean; watchVideo?: boolean },
    ) => post<{ ok: boolean }>(`${base}/api/group/${code}/settings`, { hostKey, ...changes }),
    stats: async (base: string, code: string) => {
        const res = await fetch(`${base}/api/group/${code}/stats`);
        if (!res.ok) throw new Error(`Hermes Music returned ${res.status}`);
        return (await res.json()) as {
            adders: { name: string; songs: number }[];
            history: (GroupSong & { by: string })[];
            songs: { artist: string; id: string; plays: number; title: string }[];
        };
    },
    upvote: (base: string, code: string, who: Who, songId: string) =>
        post<{ votes: number }>(`${base}/api/group/${code}/upvote`, { songId, ...who }),
};
