import { persist } from 'zustand/middleware';
import { createWithEqualityFn } from 'zustand/traditional';

export interface GroupRequest {
    by: string;
    rid: string;
    song: GroupSong;
}

export interface GroupSong {
    album: string;
    artist: string;
    duration: number;
    id: string;
    title: string;
}

export interface GroupState {
    code: string;
    ended: boolean;
    host: string;
    index: number;
    members: string[];
    name: string;
    playing: boolean;
    position: number;
    queue: GroupSong[];
    requests: GroupRequest[];
    serverNow: number;
    updatedAt: number;
}

// Group Play session. Hermes Music runs the group; the host's player is the source of truth and
// members follow it. Only the display name is remembered between restarts.
interface GroupPlayStore {
    actions: {
        leave: () => void;
        setSession: (session: {
            code: string;
            hostKey?: string;
            member?: string;
            role: 'host' | 'member';
        }) => void;
        setState: (state: GroupState) => void;
        setUserName: (userName: string) => void;
    };
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
                setSession: ({ code, hostKey, member, role }) =>
                    set({ code, hostKey: hostKey ?? null, member: member ?? null, role }),
                setState: (state) => set({ clockOffset: state.serverNow - Date.now(), state }),
                setUserName: (userName) => set({ userName: userName.slice(0, 40) }),
            },
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
            partialize: (state) => ({ userName: state.userName }),
        },
    ),
);

export const useGroupPlayActions = () => useGroupPlayStore((state) => state.actions);
