import { persist } from 'zustand/middleware';
import { createWithEqualityFn } from 'zustand/traditional';

export interface GroupCommand {
    by: string;
    cid: string;
    cmd: GroupControl;
    index: number;
    position: number;
    songId: null | string;
}

export type GroupControl =
    | 'next'
    | 'pause'
    | 'play'
    | 'playIndex'
    | 'playNext'
    | 'previous'
    | 'remove'
    | 'seek';

export interface GroupListing {
    code: string;
    host: string;
    listening: number;
    name: string;
    nowPlaying: null | { artist: string; imageId: null | string; title: string };
    playing: boolean;
}

export interface GroupMember {
    avatar: number;
    id: string;
    name: string;
}

export interface GroupRequest {
    by: string;
    rid: string;
    song: GroupSong;
}

export interface GroupSong {
    album: string;
    artist: string;
    by?: string;
    duration: number;
    id: string;
    imageId?: null | string;
    title: string;
}

export interface GroupState {
    code: string;
    commands: GroupCommand[];
    ended: boolean;
    guestControl: boolean;
    host: string;
    hostAvatar: number;
    index: number;
    listed: boolean;
    members: GroupMember[];
    name: string;
    playing: boolean;
    position: number;
    queue: GroupSong[];
    requests: GroupRequest[];
    serverNow: number;
    updatedAt: number;
}

// Group Play session (like a Spotify Jam). Hermes Music runs the group; the host's player is the
// source of truth and members follow it. Your name and picture are remembered between restarts.
interface GroupPlayStore {
    actions: {
        leave: () => void;
        setAvatar: (avatar: null | string) => void;
        setSession: (session: {
            code: string;
            hostKey?: string;
            member?: string;
            role: 'host' | 'member';
        }) => void;
        setState: (state: GroupState) => void;
        setUserName: (userName: string) => void;
    };
    avatar: null | string;
    clockOffset: number;
    code: null | string;
    hostKey: null | string;
    member: null | string;
    role: 'host' | 'member' | null;
    state: GroupState | null;
    userName: string;
}

export const useGroupPlayStore = createWithEqualityFn<GroupPlayStore>()(
    persist(
        (set) => ({
            actions: {
                leave: () =>
                    set({ code: null, hostKey: null, member: null, role: null, state: null }),
                setAvatar: (avatar) => set({ avatar }),
                setSession: ({ code, hostKey, member, role }) =>
                    set({ code, hostKey: hostKey ?? null, member: member ?? null, role }),
                setState: (state) => set({ clockOffset: state.serverNow - Date.now(), state }),
                setUserName: (userName) => set({ userName: userName.slice(0, 40) }),
            },
            avatar: null,
            clockOffset: 0,
            code: null,
            hostKey: null,
            member: null,
            role: null,
            state: null,
            userName: '',
        }),
        {
            name: 'group-play',
            partialize: (state) => ({ avatar: state.avatar, userName: state.userName }),
        },
    ),
);

export const useGroupPlayActions = () => useGroupPlayStore((state) => state.actions);
