import isElectron from 'is-electron';
import { useEffect } from 'react';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { getItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { playlistsQueries } from '/@/renderer/features/playlists/api/playlists-api';
import { radioQueries } from '/@/renderer/features/radio/api/radio-api';
import { useRadioStore } from '/@/renderer/features/radio/hooks/use-radio-player';
import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import { queryClient } from '/@/renderer/lib/react-query';
import { useArtistRadioCount } from '/@/renderer/store';
import { useAuthStore } from '/@/renderer/store/auth.store';
import { usePlayerStoreBase } from '/@/renderer/store/player.store';
import { useRemoteSettings } from '/@/renderer/store/settings.store';
import {
    Album,
    AlbumListSort,
    LibraryItem,
    Played,
    Playlist,
    PlaylistListSort,
    ServerType,
    Song,
    SongListSort,
    SortOrder,
} from '/@/shared/types/domain-types';
import {
    RemoteAlbumItem,
    RemotePlaylistItem,
    RemoteRadioItem,
    RemoteTrackItem,
} from '/@/shared/types/remote-types';
import { Play } from '/@/shared/types/types';

const remote = isElectron() ? window.api.remote : null;
const ipc = isElectron() ? window.api.ipc : null;

const DEFAULT_PAGE_SIZE = 30;

// fetchSongsByItemType() (player-context.tsx) has no LibraryItem.SONG case —
// it only handles ALBUM/ALBUM_ARTIST/ARTIST/FOLDER/GENRE/PLAYLIST, so
// addToQueueByFetch(..., LibraryItem.SONG, ...) silently resolves an empty
// song list and plays nothing. Cache the full Song objects we already fetched
// for the tracks list and hand them to addToQueueByData() directly instead,
// which needs no further lookup. Falls back to a single-song detail fetch for
// the rare case a track is played without ever having been listed first.
//
// Bounded LRU, not an unbounded Map — a long browsing/search session over a
// large library would otherwise keep every page of full Song objects (with
// image URLs and metadata) resident for the renderer's entire lifetime.
// `Map` preserves insertion order, so re-inserting on both write and read
// hits is enough to track recency without a separate structure.
const TRACK_CACHE_MAX_SIZE = 500;
const trackCache = new Map<string, Song>();

function cacheTrack(song: Song): void {
    trackCache.delete(song.id);
    trackCache.set(song.id, song);
    if (trackCache.size > TRACK_CACHE_MAX_SIZE) {
        const oldestKey = trackCache.keys().next().value;
        if (oldestKey !== undefined) trackCache.delete(oldestKey);
    }
}

function getCachedTrack(id: string): Song | undefined {
    const song = trackCache.get(id);
    if (song) {
        trackCache.delete(id);
        trackCache.set(id, song);
    }
    return song;
}

const toRemoteTrackItem = (song: Song): RemoteTrackItem => ({
    album: song.album,
    artistName: song.artistName,
    duration: song.duration,
    id: song.id,
    imageUrl:
        getItemImageUrl({
            id: song.id,
            imageUrl: song.imageUrl,
            itemType: LibraryItem.SONG,
            serverId: song._serverId,
            type: 'itemCard',
            useRemoteUrl: true,
        }) ?? null,
    name: song.name,
});

const cacheAndMapTracks = (songs: Song[]): RemoteTrackItem[] =>
    songs.map((song) => {
        cacheTrack(song);
        return toRemoteTrackItem(song);
    });

const toRemoteAlbumItem = (album: Album): RemoteAlbumItem => ({
    albumArtistName: album.albumArtistName,
    duration: album.duration,
    id: album.id,
    imageUrl:
        getItemImageUrl({
            id: album.id,
            imageUrl: album.imageUrl,
            itemType: LibraryItem.ALBUM,
            serverId: album._serverId,
            type: 'itemCard',
            useRemoteUrl: true,
        }) ?? null,
    name: album.name,
    releaseYear: album.releaseYear,
    songCount: album.songCount,
});

const toRemotePlaylistItem = (playlist: Playlist): RemotePlaylistItem => ({
    duration: playlist.duration,
    id: playlist.id,
    imageUrl:
        getItemImageUrl({
            id: playlist.id,
            imageUrl: playlist.imageUrl,
            itemType: LibraryItem.PLAYLIST,
            serverId: playlist._serverId,
            type: 'itemCard',
            useRemoteUrl: true,
        }) ?? null,
    name: playlist.name,
    songCount: playlist.songCount,
});

/**
 * Bridges phone-remote library-browsing requests (tracks/playlists/radio
 * search + play, queue jump) to the real, authenticated media-server session.
 * AudioPlayers (where this hook mounts) is a child of PlayerProvider, so
 * usePlayer() is directly available here.
 */
export const useRemoteLibrary = () => {
    const isRemoteEnabled = useRemoteSettings().enabled;
    const {
        addToQueueByData,
        addToQueueByFetch,
        clearQueue,
        clearSelected,
        getQueue,
        moveSelectedTo,
    } = usePlayer();
    const radioCount = useArtistRadioCount();

    useEffect(() => {
        if (!isRemoteEnabled || !remote) return;

        remote.requestTracks(async ({ limit, requestId, searchTerm, startIndex }) => {
            const server = useAuthStore.getState().currentServer;
            if (!server) {
                remote?.respondTracks(requestId, false, []);
                return;
            }

            const pageSize = limit ?? DEFAULT_PAGE_SIZE;
            try {
                // Plain Subsonic has no generic "list all songs" endpoint —
                // a filterless getSongList falls through to an empty search3
                // query, which isn't a reliable browse. Navidrome/Jellyfin
                // both have real generic listings and work fine filterless.
                if (server.type === ServerType.SUBSONIC && !searchTerm) {
                    const { items } = await queryClient.fetchQuery(
                        songsQueries.random({
                            query: { limit: pageSize, played: Played.All },
                            serverId: server.id,
                        }),
                    );
                    // RandomSongListQuery has no startIndex — not paginable,
                    // so "load more" just returns another random batch.
                    remote?.respondTracks(requestId, true, cacheAndMapTracks(items));
                    return;
                }

                const { items } = await queryClient.fetchQuery(
                    songsQueries.list({
                        query: {
                            limit: pageSize,
                            searchTerm,
                            sortBy: SongListSort.NAME,
                            sortOrder: SortOrder.ASC,
                            startIndex: startIndex ?? 0,
                        },
                        serverId: server.id,
                    }),
                );
                remote?.respondTracks(
                    requestId,
                    items.length === pageSize,
                    cacheAndMapTracks(items),
                );
            } catch {
                remote?.respondTracks(requestId, false, []);
            }
        });

        remote.requestAlbums(async ({ limit, requestId, searchTerm, startIndex }) => {
            const server = useAuthStore.getState().currentServer;
            if (!server) {
                remote?.respondAlbums(requestId, false, []);
                return;
            }

            const pageSize = limit ?? DEFAULT_PAGE_SIZE;
            try {
                // Unlike songs, Subsonic's getAlbumList2 is a real generic
                // listing even without a search term — no random-batch
                // fallback needed here.
                const { items } = await queryClient.fetchQuery(
                    albumQueries.list({
                        query: {
                            limit: pageSize,
                            searchTerm,
                            sortBy: AlbumListSort.NAME,
                            sortOrder: SortOrder.ASC,
                            startIndex: startIndex ?? 0,
                        },
                        serverId: server.id,
                    }),
                );
                remote?.respondAlbums(
                    requestId,
                    items.length === pageSize,
                    items.map(toRemoteAlbumItem),
                );
            } catch {
                remote?.respondAlbums(requestId, false, []);
            }
        });

        remote.requestPlaylists(async ({ limit, requestId, searchTerm, startIndex }) => {
            const server = useAuthStore.getState().currentServer;
            if (!server) {
                remote?.respondPlaylists(requestId, false, []);
                return;
            }

            const pageSize = limit ?? DEFAULT_PAGE_SIZE;
            try {
                const { items } = await queryClient.fetchQuery(
                    playlistsQueries.list({
                        query: {
                            limit: pageSize,
                            searchTerm,
                            sortBy: PlaylistListSort.NAME,
                            sortOrder: SortOrder.ASC,
                            startIndex: startIndex ?? 0,
                        },
                        serverId: server.id,
                    }),
                );
                remote?.respondPlaylists(
                    requestId,
                    items.length === pageSize,
                    items.map(toRemotePlaylistItem),
                );
            } catch {
                remote?.respondPlaylists(requestId, false, []);
            }
        });

        remote.requestRadio(async ({ limit, requestId, searchTerm, startIndex }) => {
            const server = useAuthStore.getState().currentServer;
            if (!server) {
                remote?.respondRadio(requestId, false, []);
                return;
            }

            const pageSize = limit ?? DEFAULT_PAGE_SIZE;
            try {
                // getInternetRadioStations has no limit/startIndex/searchTerm
                // of its own — internet radio lists aren't server-paginable
                // (unlike songs/albums/playlists). React Query caches the
                // full list for an hour (radio-api.ts), so slicing/filtering
                // here per page is cheap rather than a real refetch each time.
                const stations = await queryClient.fetchQuery(
                    radioQueries.list({ query: undefined, serverId: server.id }),
                );
                const filtered = searchTerm
                    ? stations.filter((station) =>
                          station.name.toLowerCase().includes(searchTerm.toLowerCase()),
                      )
                    : stations;
                const start = startIndex ?? 0;
                const page = filtered.slice(start, start + pageSize);
                const items: RemoteRadioItem[] = page.map((station) => ({
                    homepageUrl: station.homepageUrl,
                    id: station.id,
                    imageUrl: station.imageUrl ?? null,
                    name: station.name,
                }));
                remote?.respondRadio(requestId, start + pageSize < filtered.length, items);
            } catch {
                remote?.respondRadio(requestId, false, []);
            }
        });

        // Acks the phone's requestId (if it sent one — older/simpler
        // events like request-play-radio don't carry one) once this
        // operation has actually landed, success or failure — the phone
        // blocks its action sheet on this instead of the ambiguous
        // "did my tap register?" silence a fire-and-forget send would leave.
        const ackOperation = (requestId: string | undefined, error?: string) => {
            if (requestId) remote?.respondOperation(requestId, error);
        };

        remote.requestPlayTrack(async ({ id, playType, requestId }) => {
            const server = useAuthStore.getState().currentServer;
            if (!server) {
                ackOperation(requestId, 'No server connected');
                return;
            }

            let song = getCachedTrack(id);
            if (!song) {
                try {
                    song = await queryClient.fetchQuery({
                        queryFn: () =>
                            api.controller.getSongDetail({
                                apiClientProps: { serverId: server.id },
                                query: { id },
                            }),
                        queryKey: ['remote-song-detail', server.id, id],
                    });
                } catch {
                    ackOperation(requestId, 'Failed to load track');
                    return;
                }
            }
            if (!song) {
                ackOperation(requestId, 'Track not found');
                return;
            }

            // Confirmation (if the desktop's confirmQueueChanges setting is
            // on) already happened on the phone, before it ever sent this
            // request — skip it here too, or the confirm modal would open
            // on the desktop screen with no way for the phone to answer it.
            addToQueueByData([song], playType ?? Play.NOW, song.id, undefined, true);
            ackOperation(requestId);
        });

        remote.requestPlayTrackRadio(async ({ id, playType, requestId }) => {
            const server = useAuthStore.getState().currentServer;
            if (!server) {
                ackOperation(requestId, 'No server connected');
                return;
            }

            let song = getCachedTrack(id);
            if (!song) {
                try {
                    song = await queryClient.fetchQuery({
                        queryFn: () =>
                            api.controller.getSongDetail({
                                apiClientProps: { serverId: server.id },
                                query: { id },
                            }),
                        queryKey: ['remote-song-detail', server.id, id],
                    });
                } catch {
                    ackOperation(requestId, 'Failed to load track');
                    return;
                }
            }
            if (!song) {
                ackOperation(requestId, 'Track not found');
                return;
            }

            try {
                const similarSongs = await queryClient.fetchQuery({
                    ...songsQueries.similar({
                        query: { count: radioCount, songId: song.id },
                        serverId: server.id,
                    }),
                    queryKey: queryKeys.player.fetch({ similarSongs: song.id }),
                });

                if (similarSongs && similarSongs.length > 0) {
                    addToQueueByData([song, ...similarSongs], playType, song.id, undefined, true);
                }
                ackOperation(requestId);
            } catch {
                ackOperation(requestId, 'Failed to load track radio');
            }
        });

        remote.requestPlayPlaylist(async ({ id, playType, requestId }) => {
            const server = useAuthStore.getState().currentServer;
            if (!server) {
                ackOperation(requestId, 'No server connected');
                return;
            }
            addToQueueByFetch(server.id, [id], LibraryItem.PLAYLIST, playType ?? Play.NOW, {
                skipConfirmation: true,
            });
            ackOperation(requestId);
        });

        remote.requestPlayAlbum(async ({ id, playType, requestId }) => {
            const server = useAuthStore.getState().currentServer;
            if (!server) {
                ackOperation(requestId, 'No server connected');
                return;
            }
            addToQueueByFetch(server.id, [id], LibraryItem.ALBUM, playType ?? Play.NOW, {
                skipConfirmation: true,
            });
            ackOperation(requestId);
        });

        remote.requestAddToPlaylist(async ({ playlistId, requestId, songId }) => {
            const server = useAuthStore.getState().currentServer;
            if (!server) {
                ackOperation(requestId, 'No server connected');
                return;
            }

            try {
                await api.controller.addToPlaylist({
                    apiClientProps: { serverId: server.id },
                    body: { songId: [songId] },
                    query: { id: playlistId },
                });

                queryClient.invalidateQueries({
                    exact: false,
                    queryKey: queryKeys.playlists.list(server.id),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.playlists.detail(server.id, playlistId),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.playlists.songList(server.id, playlistId),
                });
                ackOperation(requestId);
            } catch {
                ackOperation(requestId, 'Failed to add to playlist');
            }
        });

        remote.requestClearQueue(({ requestId }) => {
            // Confirmation already happened on the phone (see
            // use-confirmed-send.ts) — same skip-and-trust as every other
            // AckableClientEvent handler here.
            clearQueue(true);
            ackOperation(requestId);
        });

        remote.requestRemoveFromQueue(({ uniqueId }) => {
            const song = getQueue().find((item) => item._uniqueId === uniqueId);
            if (!song) return;
            clearSelected([song]);
        });

        remote.requestReorderQueue(({ edge, targetUniqueId, uniqueId }) => {
            const movedSong = getQueue().find((item) => item._uniqueId === uniqueId);
            if (!movedSong) return;
            moveSelectedTo([movedSong], edge, targetUniqueId);
        });

        remote.requestPlayRadio(async ({ id }) => {
            const server = useAuthStore.getState().currentServer;
            if (!server) return;

            try {
                const stations = await queryClient.fetchQuery(
                    radioQueries.list({ query: undefined, serverId: server.id }),
                );
                const station = stations.find((s) => s.id === id);
                if (!station) return;

                useRadioStore.getState().actions.play(station.streamUrl, station.name, {
                    id: station.id,
                    imageId: station.imageId,
                    imageUrl: station.imageUrl,
                    serverId: server.id,
                });
            } catch {
                // Nothing to do — station list fetch failed, no station to play.
            }
        });

        remote.requestQueueJump(({ uniqueId }) => {
            usePlayerStoreBase.getState().mediaPlay(uniqueId);
        });

        return () => {
            ipc?.removeAllListeners('request-tracks');
            ipc?.removeAllListeners('request-albums');
            ipc?.removeAllListeners('request-playlists');
            ipc?.removeAllListeners('request-radio');
            ipc?.removeAllListeners('request-play-track');
            ipc?.removeAllListeners('request-play-track-radio');
            ipc?.removeAllListeners('request-play-playlist');
            ipc?.removeAllListeners('request-play-album');
            ipc?.removeAllListeners('request-play-radio');
            ipc?.removeAllListeners('request-add-to-playlist');
            ipc?.removeAllListeners('request-clear-queue');
            ipc?.removeAllListeners('request-remove-from-queue');
            ipc?.removeAllListeners('request-reorder-queue');
            ipc?.removeAllListeners('request-queue-jump');
        };
    }, [
        isRemoteEnabled,
        addToQueueByData,
        addToQueueByFetch,
        clearQueue,
        clearSelected,
        getQueue,
        moveSelectedTo,
        radioCount,
    ]);
};

export const RemoteLibraryHook = () => {
    useRemoteLibrary();
    return null;
};
