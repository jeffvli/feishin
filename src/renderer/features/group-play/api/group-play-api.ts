import {
    type GroupControl,
    type GroupListing,
    type GroupSong,
    type GroupState,
    type ThemeNight,
} from '/@/renderer/features/group-play/store/group-play.store';
import { type Song } from '/@/shared/types/domain-types';

export interface SessionSummary {
    end: number;
    host: string;
    id: string;
    minutes: number;
    name: string;
    people: string[];
    reactions: number;
    skips: number;
    songs: number;
    start: number;
    topAdder: null | { name: string; songs: number };
    topSong: GroupSong | null;
}

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
    year: song.releaseYear ?? null,
});

export const groupApi = {
    add: (base: string, code: string, user: string, songs: GroupSong[], member?: null | string) =>
        post<{ added: number }>(`${base}/api/group/${code}/add`, { member, songs, user }),
    // the request line: the host lets a guest's pick in (or not)
    approve: (base: string, code: string, hostKey: string, rid: string, accept: boolean) =>
        post<{ ok: boolean }>(`${base}/api/group/${code}/approve`, { accept, hostKey, rid }),
    // spend a token: your pick jumps to next
    boost: (base: string, code: string, who: Who, songId: string) =>
        post<{ tokens: number }>(`${base}/api/group/${code}/boost`, { songId, ...who }),
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
    countdown: (base: string, code: string, hostKey: string) =>
        post<{ at: number; serverNow: number }>(`${base}/api/group/${code}/countdown`, { hostKey }),
    // tv: a Sour Player TV party (admins), named after the event
    create: (
        base: string,
        name: string,
        user: string,
        profile: null | string,
        tv?: { event: string; key: string },
    ) =>
        post<Created>(`${base}/api/group/create`, {
            key: tv?.key,
            name,
            profile,
            tv: tv ? { event: tv.event } : undefined,
            user,
        }),
    encore: (base: string, code: string, who: Who) =>
        post<{ happening: boolean; needed: number; votes: number }>(
            `${base}/api/group/${code}/encore`,
            who,
        ),
    end: (base: string, code: string, hostKey: string) =>
        post<{ ok: boolean }>(`${base}/api/group/${code}/end`, { hostKey }),
    // Sour Radio: random songs from this computer's library when it runs low
    fill: (base: string, code: string, member: string, songs: GroupSong[]) =>
        post<{ added: number }>(`${base}/api/group/${code}/fill`, { member, songs }),
    guess: (base: string, code: string, member: string, songId: string, name: string) =>
        post<{ ok: boolean }>(`${base}/api/group/${code}/guess`, { member, name, songId }),
    // pass the group to someone in it; you stay as a listener (the answer is your new member id)
    handoff: (base: string, code: string, hostKey: string, target: string) =>
        post<{ member: string }>(`${base}/api/group/${code}/handoff`, { hostKey, target }),
    join: (base: string, code: string, user: string, profile: null | string, spectate = false) =>
        post<Joined>(`${base}/api/group/${code}/join`, { profile, spectate, user }),
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
    ping: (base: string, code: string, who: Who, position?: number) =>
        post<{ ok: boolean }>(`${base}/api/group/${code}/ping`, { ...who, position }),
    // change your picture while in a group
    profile: (
        base: string,
        code: string,
        who: { hostKey?: null | string; member?: null | string },
        avatar: null | string,
    ) => post<{ ok: boolean }>(`${base}/api/group/${code}/profile`, { avatar, ...who }),
    react: (base: string, code: string, who: Who, emoji: string, position?: number) =>
        post<{ ok: boolean }>(`${base}/api/group/${code}/react`, { emoji, position, ...who }),
    report: (base: string, code: string, body: Record<string, unknown>) =>
        post<{ ok: boolean }>(`${base}/api/group/${code}/report`, body),
    // your own always-on room (one per person)
    room: (base: string, profile: string, key: string, name: string, remove?: boolean) =>
        post<{ code: string; name: string }>(`${base}/api/group/rooms`, {
            key,
            name,
            profile,
            remove,
        }),
    // book a DJ show on a station (start in ms, length in minutes), or cancel one
    schedule: (
        base: string,
        code: string,
        body: {
            cancel?: string;
            key: string;
            member?: null | string;
            minutes?: number;
            profile: string;
            start?: number;
        },
    ) => post<{ ok: boolean }>(`${base}/api/group/${code}/schedule`, body),
    scrapbook: async (base: string) => {
        const res = await fetch(`${base}/api/group/scrapbook`);
        if (!res.ok) throw new Error(`Hermes Music returned ${res.status}`);
        const list = await res.json().catch(() => null);
        return (Array.isArray(list) ? list : []) as SessionSummary[];
    },
    settings: (
        base: string,
        code: string,
        hostKey: string,
        changes: {
            approval?: boolean;
            blind?: boolean;
            djRotation?: boolean;
            guestControl?: boolean;
            listed?: boolean;
            roomTheme?: string;
            syncLook?: boolean;
            themeNight?: null | ThemeNight;
            watchVideo?: boolean;
        },
    ) => post<{ ok: boolean }>(`${base}/api/group/${code}/settings`, { hostKey, ...changes }),
    sound: (base: string, code: string, who: Who, name: string) =>
        post<{ ok: boolean }>(`${base}/api/group/${code}/sound`, { name, ...who }),
    stats: async (base: string, code: string) => {
        const res = await fetch(`${base}/api/group/${code}/stats`);
        if (!res.ok) throw new Error(`Hermes Music returned ${res.status}`);
        return (await res.json()) as {
            adders: { name: string; songs: number }[];
            history: (GroupSong & { by: string })[];
            songs: { artist: string; id: string; plays: number; title: string }[];
        };
    },
    // Sour Player TV: the host adds (or removes) someone who's at the event
    tvMember: (
        base: string,
        code: string,
        hostKey: string,
        change: { add?: string; remove?: string },
    ) => post<{ members: string[] }>(`${base}/api/group/${code}/tvmember`, { hostKey, ...change }),
    upvote: (base: string, code: string, who: Who, songId: string) =>
        post<{ votes: number }>(`${base}/api/group/${code}/upvote`, { songId, ...who }),
    // a room's owner or DJ: blind round, theme night, room look
    vibe: (
        base: string,
        code: string,
        member: string,
        changes: { blind?: boolean; roomTheme?: string; themeNight?: null | ThemeNight },
    ) => post<{ ok: boolean }>(`${base}/api/group/${code}/vibe`, { member, ...changes }),
};
