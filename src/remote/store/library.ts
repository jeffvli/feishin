import { create } from 'zustand';

import {
    RemoteAlbumItem,
    RemotePlaylistItem,
    RemoteQueueItem,
    RemoteRadioItem,
    RemoteTrackItem,
    ServerRadioStatus,
} from '/@/shared/types/remote-types';

// `execute` is deferred here rather than run immediately — the point of
// asking is to let the confirm sheet (mounted once in shell.tsx) decide
// whether it actually happens. `cancel` lets whoever asked (use-confirmed-
// send.ts) settle its own pending promise when the user declines instead of
// leaving it hanging forever — a Play submenu tap that ends in "discard the
// queue? no" still needs its acked-send promise to resolve so the action
// sheet's spinner clears.
export interface QueueReplaceConfirmRequest {
    cancel: () => void;
    // Returns the acked-send promise so the confirm sheet can show its own
    // loading state instead of closing instantly on tap - the sheet that
    // asked is already gone by then (see track/album/playlist-action-sheet),
    // so this is the only place left to show that anything is happening.
    execute: () => Promise<void>;
}

// Transient session data (not persisted, unlike store/index.ts's settings) —
// tracks/playlists browsing results, the one-shot radio station list, live
// queue state, and radio-active status. Written by store/index.ts's existing
// WS message handler (same socket, no second connection), read by the
// tab pages via the selector hooks below.
interface LibraryListState<T> {
    hasMore: boolean;
    items: T[];
    // Tracks which request this data answers, so callers (useRemoteQuery) can
    // tell a fresh response apart from a stale one still in flight.
    requestId: null | string;
}

interface LibrarySlice extends LibraryState {
    actions: {
        clearQueueReplaceConfirm: () => void;
        requestQueueReplaceConfirm: (request: QueueReplaceConfirmRequest) => void;
        setAlbumsResponse: (requestId: string, hasMore: boolean, items: RemoteAlbumItem[]) => void;
        setPlaylistsResponse: (
            requestId: string,
            hasMore: boolean,
            items: RemotePlaylistItem[],
        ) => void;
        setQueueState: (state: QueueState) => void;
        setRadioResponse: (requestId: string, hasMore: boolean, items: RemoteRadioItem[]) => void;
        setRadioStatus: (status: ServerRadioStatus['data']) => void;
        setTracksResponse: (requestId: string, hasMore: boolean, items: RemoteTrackItem[]) => void;
    };
}

interface LibraryState {
    albums: LibraryListState<RemoteAlbumItem>;
    playlists: LibraryListState<RemotePlaylistItem>;
    queue: QueueState;
    // Non-null while the queue-replace confirm sheet (shell.tsx) is open —
    // see use-confirmed-send.ts, the only place this gets set.
    queueReplaceConfirm: null | QueueReplaceConfirmRequest;
    radio: LibraryListState<RemoteRadioItem>;
    radioStatus: ServerRadioStatus['data'];
    tracks: LibraryListState<RemoteTrackItem>;
}

interface QueueState {
    currentUniqueId: null | string;
    items: RemoteQueueItem[];
}

export const useRemoteLibraryStore = create<LibrarySlice>((set) => ({
    actions: {
        clearQueueReplaceConfirm: () => set({ queueReplaceConfirm: null }),
        requestQueueReplaceConfirm: (request) => set({ queueReplaceConfirm: request }),
        setAlbumsResponse: (requestId, hasMore, items) =>
            set({ albums: { hasMore, items, requestId } }),
        setPlaylistsResponse: (requestId, hasMore, items) =>
            set({ playlists: { hasMore, items, requestId } }),
        setQueueState: (state) => set({ queue: state }),
        setRadioResponse: (requestId, hasMore, items) =>
            set({ radio: { hasMore, items, requestId } }),
        setRadioStatus: (status) => set({ radioStatus: status }),
        setTracksResponse: (requestId, hasMore, items) =>
            set({ tracks: { hasMore, items, requestId } }),
    },
    albums: { hasMore: false, items: [], requestId: null },
    playlists: { hasMore: false, items: [], requestId: null },
    queue: { currentUniqueId: null, items: [] },
    queueReplaceConfirm: null,
    radio: { hasMore: false, items: [], requestId: null },
    radioStatus: { isActive: false },
    tracks: { hasMore: false, items: [], requestId: null },
}));

export const useAlbumsResponse = () => useRemoteLibraryStore((state) => state.albums);

export const usePlaylistsResponse = () => useRemoteLibraryStore((state) => state.playlists);

export const useQueueReplaceConfirm = () =>
    useRemoteLibraryStore((state) => state.queueReplaceConfirm);

export const useQueueState = () => useRemoteLibraryStore((state) => state.queue);

export const useRadioResponse = () => useRemoteLibraryStore((state) => state.radio);

export const useRadioStatus = () => useRemoteLibraryStore((state) => state.radioStatus);

export const useTracksResponse = () => useRemoteLibraryStore((state) => state.tracks);
