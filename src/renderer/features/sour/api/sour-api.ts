import { type GroupSong } from '/@/renderer/features/group-play/store/group-play.store';

export type FavoriteKind = 'album' | 'artist' | 'song';

export interface Me {
    id: string;
    key: string;
}

export interface PlaylistTheme {
    color: null | string;
    image: number;
    owner: string;
    ownerName: null | string;
}

export interface SourProfile {
    avatar: number;
    banner: number;
    bio: string;
    color: null | string;
    created: string;
    favorites: GroupSong[];
    id: string;
    lastSeen: null | number;
    listening: GroupSong | null;
    name: string;
    online: boolean;
    playing: boolean;
    status: string;
}

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
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `Hermes Music returned ${res.status}`);
    return json as T;
};

// Favourite albums and artists are kept in the profile's favourites list next to the songs, with
// "album:" or "artist:" in front of their id (so Hermes Music needs no changes for them).
export const favoriteKind = (f: GroupSong): FavoriteKind =>
    f.id.startsWith('album:') ? 'album' : f.id.startsWith('artist:') ? 'artist' : 'song';

export const favoriteId = (f: GroupSong) => f.id.replace(/^(album|artist):/, '');

export const avatarUrl = (base: string, profile?: null | Pick<SourProfile, 'avatar' | 'id'>) =>
    profile?.avatar ? `${base}/api/profiles/${profile.id}/avatar?v=${profile.avatar}` : null;

export const bannerUrl = (base: string, profile?: null | Pick<SourProfile, 'banner' | 'id'>) =>
    profile?.banner ? `${base}/api/profiles/${profile.id}/banner?v=${profile.banner}` : null;

// Sour Player's side of Hermes Music: profiles, who's online and playlist themes.
export const sourApi = {
    list: (base: string) => call<SourProfile[]>(`${base}/api/profiles`),
    playlistTheme: async (base: string, playlistId: string) => {
        const res = await fetch(`${base}/api/playlist-themes/${encodeURIComponent(playlistId)}`);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`Hermes Music returned ${res.status}`);
        return (await res.json()) as PlaylistTheme;
    },
    presence: (base: string, me: Me, listening: GroupSong | null, playing: boolean) =>
        call<{ ok: boolean }>(`${base}/api/presence`, { ...me, listening, playing }),
    profile: (base: string, id: string) => call<SourProfile>(`${base}/api/profiles/${id}`),
    register: (base: string, name: string) =>
        call<{ id: string; key: string; profile: SourProfile }>(`${base}/api/profiles`, { name }),
    setImage: (base: string, me: Me, kind: 'avatar' | 'banner', data: null | string) =>
        call<SourProfile>(`${base}/api/profiles/${me.id}/image`, { data, key: me.key, kind }),
    setPlaylistTheme: (
        base: string,
        me: Me,
        playlistId: string,
        changes: { color?: null | string; image?: null | string; remove?: boolean },
    ) =>
        call<PlaylistTheme>(`${base}/api/playlist-themes/${encodeURIComponent(playlistId)}`, {
            key: me.key,
            profile: me.id,
            ...changes,
        }),
    update: (
        base: string,
        me: Me,
        changes: Partial<Pick<SourProfile, 'bio' | 'color' | 'favorites' | 'name' | 'status'>>,
    ) => call<SourProfile>(`${base}/api/profiles/${me.id}`, { key: me.key, ...changes }),
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
