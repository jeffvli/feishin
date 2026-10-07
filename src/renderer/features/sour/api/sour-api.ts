import { type GroupSong } from '/@/renderer/features/group-play/store/group-play.store';

export type FavoriteKind = 'album' | 'artist' | 'song';

export interface FriendGroup {
    bio: string;
    hoursWeek: number;
    members: { avatar: number; id: string; name: string }[];
    name: string;
    picture: number;
    topSongs: (GroupSong & { plays: number })[];
}

export interface LeaderboardRow {
    avatar: number;
    hours: number;
    id: string;
    name: string;
    requests: number;
    skips: number;
}

export interface Me {
    id: string;
    key: string;
}

export interface Milestone {
    at: number;
    id: string;
    text: string;
}

export interface Nickname {
    at: number;
    from: string;
    fromName: string;
    nick: string;
}

export interface PlaylistTheme {
    color: null | string;
    font?: null | string;
    image: number;
    owner: string;
    ownerName: null | string;
}

// everything about how a profile looks and what it shows, stored on Hermes Music as one JSON object
export interface ProfileCustom {
    bannerPos?: { x: number; y: number; zoom: number };
    birthday?: string;
    dnd?: boolean;
    emoji?: string;
    frame?: string;
    genres?: string[];
    gradient?: string[];
    header?: string;
    hiddenSongs?: string[];
    invisible?: boolean;
    joinSound?: string;
    jokes?: string;
    nameEffect?: string;
    nameFont?: string;
    nickname?: string;
    pinnedPlaylist?: { id: string; imageId: null | string; name: string };
    privacy?: {
        hideFavorites?: boolean;
        hideLastOnline?: boolean;
        hideListening?: boolean;
        hideStats?: boolean;
        private?: boolean;
    };
    recentPlays?: GroupSong[];
    sections?: { hidden: string[]; order: string[] };
    signatureSong?: GroupSong | null;
    spotlight?: null | { song: GroupSong; week: string };
    spotlightHistory?: { song: GroupSong; week: string }[];
    stickers?: { emoji: string; x: number; y: number }[];
    theme?: { accent?: string; background?: string; card?: string };
    top5?: GroupSong[];
}

export interface ProfileStats {
    hoursTotal: number;
    hoursWeek: number;
    topArtists: { name: string; plays: number }[];
    topSongs: (GroupSong & { plays: number })[];
}

export interface SourProfile {
    avatar: number;
    avatarHistory?: number[];
    away: string;
    background: number;
    banner: number;
    bio: string;
    color: null | string;
    created: string;
    custom: ProfileCustom;
    favorites: GroupSong[];
    group: null | { code: string; name: string };
    id: string;
    lastSeen: null | number;
    listening: GroupSong | null;
    name: string;
    nicknames: Nickname[];
    online: boolean;
    perks?: string[];
    playing: boolean;
    position: number;
    positionAt: number;
    resume?: null | { at: number; device: string; position: number; song: GroupSong };
    stats?: ProfileStats;
    status: string;
    wall: WallNote[];
}

export interface WallNote {
    at: number;
    from: string;
    fromName: string;
    id: string;
    song: GroupSong | null;
    text: string;
}

const NOT_HERMES =
    "That address doesn't answer like Hermes Music (Settings > General > Music videos)";

const call = async <T>(url: string, body?: unknown): Promise<T> => {
    const res = await fetch(
        url,
        body === undefined
            ? undefined
            : {
                  body: JSON.stringify(body),
                  headers: { 'content-type': 'application/json' },
                  method: 'POST',
              },
    );
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.error || `Hermes Music returned ${res.status}`);
    // a wrong address (Umbrel's own page, Navidrome...) answers with a web page, not Hermes Music
    if (json === null || typeof json !== 'object') throw new Error(NOT_HERMES);
    return json as T;
};

const callList = async <T>(url: string): Promise<T[]> => {
    const list = await call<T[]>(url);
    if (!Array.isArray(list)) throw new Error(NOT_HERMES);
    return list;
};

// Favourite albums and artists are kept in the profile's favourites list next to the songs, with
// "album:" or "artist:" in front of their id.
export const favoriteKind = (f: GroupSong): FavoriteKind =>
    f.id.startsWith('album:') ? 'album' : f.id.startsWith('artist:') ? 'artist' : 'song';

export const favoriteId = (f: GroupSong) => f.id.replace(/^(album|artist):/, '');

export const avatarUrl = (base: string, profile?: null | Pick<SourProfile, 'avatar' | 'id'>) =>
    profile?.avatar ? `${base}/api/profiles/${profile.id}/avatar?v=${profile.avatar}` : null;

export const bannerUrl = (base: string, profile?: null | Pick<SourProfile, 'banner' | 'id'>) =>
    profile?.banner ? `${base}/api/profiles/${profile.id}/banner?v=${profile.banner}` : null;

export const backgroundUrl = (
    base: string,
    profile?: null | Pick<SourProfile, 'background' | 'id'>,
) =>
    profile?.background
        ? `${base}/api/profiles/${profile.id}/background?v=${profile.background}`
        : null;

// Sour Player's side of Hermes Music: profiles, who's online, stats and playlist themes.
export const sourApi = {
    claim: (base: string, code: string) =>
        call<{ id: string; key: string; profile: SourProfile }>(`${base}/api/profiles/claim`, {
            code,
        }),
    follow: (base: string, me: Me, artist: string) =>
        call<{ artist: string; deezerId: number }>(`${base}/api/follows`, {
            artist,
            key: me.key,
            profile: me.id,
        }),
    friendGroup: (base: string) => call<FriendGroup>(`${base}/api/friend-group`),
    groupTop: (base: string) => callList<GroupSong & { plays: number }>(`${base}/api/group-top`),
    inbox: (base: string, me: Me, since: number) =>
        call<{ notes: WallNote[]; pings: { at: number; from: string; fromName: string }[] }>(
            `${base}/api/profiles/${me.id}/inbox`,
            { key: me.key, since },
        ),
    leaderboard: (base: string) => callList<LeaderboardRow>(`${base}/api/leaderboard`),
    link: (base: string, me: Me) =>
        call<{ code: string }>(`${base}/api/profiles/${me.id}/link`, { key: me.key }),
    list: (base: string) => callList<SourProfile>(`${base}/api/profiles`),
    me: (base: string, me: Me) =>
        call<SourProfile>(`${base}/api/profiles/${me.id}/me`, { key: me.key }),
    milestones: (base: string) => callList<Milestone>(`${base}/api/milestones`),
    nickname: (base: string, me: Me, profileId: string, nick: string) =>
        call<SourProfile>(`${base}/api/profiles/${profileId}/nickname`, {
            from: me.id,
            key: me.key,
            nick,
        }),
    ping: (base: string, me: Me, profileId: string) =>
        call<{ ok: boolean }>(`${base}/api/profiles/${profileId}/ping`, {
            from: me.id,
            key: me.key,
        }),
    playlistTheme: async (base: string, playlistId: string) => {
        const res = await fetch(`${base}/api/playlist-themes/${encodeURIComponent(playlistId)}`);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`Hermes Music returned ${res.status}`);
        return (await res.json()) as PlaylistTheme;
    },
    presence: (base: string, me: Me, body: Record<string, unknown>) =>
        call<{ ok: boolean }>(`${base}/api/presence`, { ...me, ...body }),
    profile: (base: string, id: string) => call<SourProfile>(`${base}/api/profiles/${id}`),
    register: (base: string, name: string) =>
        call<{ id: string; key: string; profile: SourProfile }>(`${base}/api/profiles`, { name }),
    restoreAvatar: (base: string, me: Me, version: number) =>
        call<SourProfile>(`${base}/api/profiles/${me.id}/image`, {
            key: me.key,
            kind: 'avatar',
            restore: version,
        }),
    saveFriendGroup: (base: string, me: Me, changes: Record<string, unknown>) =>
        call<{ ok: boolean }>(`${base}/api/friend-group`, {
            key: me.key,
            profile: me.id,
            ...changes,
        }),
    setImage: (
        base: string,
        me: Me,
        kind: 'avatar' | 'background' | 'banner',
        data: null | string,
    ) => call<SourProfile>(`${base}/api/profiles/${me.id}/image`, { data, key: me.key, kind }),
    setPlaylistTheme: (
        base: string,
        me: Me,
        playlistId: string,
        changes: {
            color?: null | string;
            font?: null | string;
            image?: null | string;
            remove?: boolean;
        },
    ) =>
        call<PlaylistTheme>(`${base}/api/playlist-themes/${encodeURIComponent(playlistId)}`, {
            key: me.key,
            profile: me.id,
            ...changes,
        }),
    songOfTheDay: async (base: string) => {
        const res = await fetch(`${base}/api/song-of-the-day`);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`Hermes Music returned ${res.status}`);
        return (await res.json()) as GroupSong & { plays: number };
    },
    update: (
        base: string,
        me: Me,
        changes: Partial<
            Pick<SourProfile, 'away' | 'bio' | 'color' | 'custom' | 'favorites' | 'name' | 'status'>
        >,
    ) => call<SourProfile>(`${base}/api/profiles/${me.id}`, { key: me.key, ...changes }),
    wall: (
        base: string,
        me: Me,
        profileId: string,
        note: { remove?: string; song?: GroupSong | null; text?: string },
    ) =>
        call<SourProfile>(`${base}/api/profiles/${profileId}/wall`, {
            from: me.id,
            key: me.key,
            ...note,
        }),
};

// Hermes Music request helpers used by Sour Player
export const requestApi = {
    screenshot: (base: string, image: string, me: Me | null, by: string) =>
        call<{ queued: number; songs: string[] }>(`${base}/api/requests/screenshot`, {
            by,
            image,
            profile: me?.id,
        }),
    vote: (base: string, me: Me, requestId: string) =>
        call<{ votes: number }>(`${base}/api/requests/${requestId}/vote`, {
            key: me.key,
            profile: me.id,
        }),
};

// A picture from the computer, ready to send: GIFs are kept as they are (so they stay animated),
// other pictures are shrunk to fit `maxSide` pixels.
export const readPicture = (file: File, maxSide: number, maxGifBytes: number) =>
    new Promise<string>((resolve, reject) => {
        if (file.type === 'image/gif') {
            if (file.size > maxGifBytes) {
                reject(new Error(`GIFs can be up to ${Math.round(maxGifBytes / 1000000)} MB`));
                return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error("That picture couldn't be read"));
            reader.readAsDataURL(file);
            return;
        }
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(img.src);
            resolve(canvas.toDataURL('image/webp', 0.9));
        };
        img.onerror = () => reject(new Error("That picture couldn't be opened"));
        img.src = URL.createObjectURL(file);
    });

export const timeAgo = (at: null | number) => {
    if (!at) return 'a while ago';
    const minutes = Math.round((Date.now() - at) / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} h ago`;
    return `${Math.round(hours / 24)} days ago`;
};

// how much two people's listening overlaps: shared top artists, weighted by rank (0-100)
export const tasteMatch = (a?: ProfileStats, b?: ProfileStats) => {
    if (!a?.topArtists.length || !b?.topArtists.length) return null;
    const weight = (list: { name: string }[]) =>
        new Map(list.map((x, i) => [x.name.toLowerCase(), list.length - i]));
    const wa = weight(a.topArtists);
    const wb = weight(b.topArtists);
    let shared = 0;
    let total = 0;
    const both: string[] = [];
    for (const [name, w] of wa) {
        total += w;
        if (wb.has(name)) {
            shared += Math.min(w, wb.get(name) ?? 0);
            both.push(name);
        }
    }
    for (const [name, w] of wb) if (!wa.has(name)) total += w;
    const percent = Math.round((shared / Math.max(1, total / 2)) * 100);
    const names = new Map(a.topArtists.map((x) => [x.name.toLowerCase(), x.name]));
    return {
        percent: Math.min(100, percent),
        shared: both.slice(0, 6).map((n) => names.get(n) ?? n),
    };
};
