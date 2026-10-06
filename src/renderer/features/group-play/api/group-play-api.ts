import {
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
    title: song.name,
});

export const groupApi = {
    add: (base: string, code: string, user: string, songs: GroupSong[]) =>
        post<{ added: number }>(`${base}/api/group/${code}/add`, { songs, user }),
    create: (base: string, name: string, user: string) =>
        post<Created>(`${base}/api/group/create`, { name, user }),
    end: (base: string, code: string, hostKey: string) =>
        post<{ ok: boolean }>(`${base}/api/group/${code}/end`, { hostKey }),
    join: (base: string, code: string, user: string) =>
        post<Joined>(`${base}/api/group/${code}/join`, { user }),
    report: (base: string, code: string, body: Record<string, unknown>) =>
        post<{ ok: boolean }>(`${base}/api/group/${code}/report`, body),
};
