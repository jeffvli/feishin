import { openContextModal } from '@mantine/modals';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Fuse from 'fuse.js';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    getAlbumArtistSongsById,
    getAlbumSongsById,
    getGenreSongsById,
    getPlaylistSongsById,
} from '/@/renderer/features/player/utils';
import { playlistsQueries } from '/@/renderer/features/playlists/api/playlists-api';
import { useRecentPlaylists } from '/@/renderer/features/playlists/hooks/use-recent-playlists';
import { useAddToPlaylist } from '/@/renderer/features/playlists/mutations/add-to-playlist-mutation';
import { useCurrentServer, useCurrentServerId } from '/@/renderer/store';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { Icon } from '/@/shared/components/icon/icon';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { toast } from '/@/shared/components/toast/toast';
import { LibraryItem, PlaylistListSort, SortOrder } from '/@/shared/types/domain-types';

interface AddToPlaylistActionProps {
    items: string[];
    itemType: LibraryItem;
}

export const AddToPlaylistAction = ({ items, itemType }: AddToPlaylistActionProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const serverId = useCurrentServerId();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const addToPlaylistMutation = useAddToPlaylist({});

    const playlistsQuery = useQuery(
        playlistsQueries.list({
            query: {
                _custom: {
                    navidrome: {
                        smart: false,
                    },
                },
                sortBy: PlaylistListSort.NAME,
                sortOrder: SortOrder.ASC,
                startIndex: 0,
            },
            serverId: server?.id,
        }),
    );

    const { recentPlaylistId } = useRecentPlaylists(serverId);

    const fuse = useMemo(() => {
        if (!playlistsQuery.data?.items) return null;

        return new Fuse(playlistsQuery.data.items, {
            fieldNormWeight: 1,
            ignoreLocation: true,
            keys: ['name'],
            threshold: 0.3,
        });
    }, [playlistsQuery.data?.items]);

    const recentPlaylist = useMemo(() => {
        if (!playlistsQuery.data?.items || !recentPlaylistId) return null;

        const playlist = playlistsQuery.data.items.find((p) => p.id === recentPlaylistId);
        if (!playlist) return null;

        if (searchTerm && fuse) {
            const results = fuse.search(searchTerm);
            const found = results.find((result) => result.item.id === recentPlaylistId);
            if (!found) return null;
        }

        return playlist;
    }, [playlistsQuery.data?.items, recentPlaylistId, searchTerm, fuse]);

    const filteredPlaylists = useMemo(() => {
        if (!playlistsQuery.data?.items) return [];
        if (!searchTerm || !fuse) {
            // Exclude recent playlist from the list if it exists
            return recentPlaylistId
                ? playlistsQuery.data.items.filter((p) => p.id !== recentPlaylistId)
                : playlistsQuery.data.items;
        }

        const results = fuse.search(searchTerm);
        const filtered = results.map((result) => result.item);
        // Exclude recent playlist from the filtered results if it exists
        return recentPlaylistId ? filtered.filter((p) => p.id !== recentPlaylistId) : filtered;
    }, [playlistsQuery.data?.items, searchTerm, fuse, recentPlaylistId]);

    const getSongsByAlbum = useCallback(
        async (albumId: string) => {
            if (!server) return null;
            return getAlbumSongsById({
                id: [albumId],
                queryClient,
                server,
            });
        },
        [queryClient, server],
    );

    const getSongsByArtist = useCallback(
        async (artistId: string) => {
            if (!server) return null;
            return getAlbumArtistSongsById({
                id: [artistId],
                queryClient,
                server,
            });
        },
        [queryClient, server],
    );

    const getSongsByGenre = useCallback(
        async (genreIds: string[]) => {
            if (!server) return null;
            return getGenreSongsById({
                id: genreIds,
                queryClient,
                server,
            });
        },
        [queryClient, server],
    );

    const getSongsByPlaylist = useCallback(
        async (playlistId: string) => {
            if (!server) return null;
            return getPlaylistSongsById({
                id: playlistId,
                queryClient,
                server,
            });
        },
        [queryClient, server],
    );

    const handleAddToPlaylist = useCallback(
        async (playlistId: string) => {
            if (items.length === 0 || !serverId) return;

            try {
                let allSongIds: string[] = [];

                if (itemType === LibraryItem.SONG) {
                    allSongIds = items;
                } else if (itemType === LibraryItem.ALBUM) {
                    for (const id of items) {
                        const songs = await getSongsByAlbum(id);
                        allSongIds.push(...(songs?.items?.map((song) => song.id) || []));
                    }
                } else if (
                    itemType === LibraryItem.ALBUM_ARTIST ||
                    itemType === LibraryItem.ARTIST
                ) {
                    for (const id of items) {
                        const songs = await getSongsByArtist(id);
                        allSongIds.push(...(songs?.items?.map((song) => song.id) || []));
                    }
                } else if (itemType === LibraryItem.GENRE) {
                    const songs = await getSongsByGenre(items);
                    allSongIds.push(...(songs?.items?.map((song) => song.id) || []));
                } else if (itemType === LibraryItem.PLAYLIST) {
                    for (const id of items) {
                        const songs = await getSongsByPlaylist(id);
                        allSongIds.push(...(songs?.items?.map((song) => song.id) || []));
                    }
                }

                if (allSongIds.length === 0) {
                    toast.error({
                        message: t('error.noItemsSelected', { postProcess: 'sentenceCase' }),
                    });
                    return;
                }

                addToPlaylistMutation.mutate(
                    {
                        apiClientProps: { serverId },
                        body: {
                            songId: allSongIds,
                        },
                        query: {
                            id: playlistId,
                        },
                    },
                    {
                        onError: (err) => {
                            toast.error({
                                message: err.message,
                                title: t('error.genericError', { postProcess: 'sentenceCase' }),
                            });
                        },
                        onSuccess: () => {},
                    },
                );
            } catch (error) {
                toast.error({
                    message: (error as Error).message,
                    title: t('error.genericError', { postProcess: 'sentenceCase' }),
                });
            }
        },
        [
            addToPlaylistMutation,
            getSongsByAlbum,
            getSongsByArtist,
            getSongsByGenre,
            getSongsByPlaylist,
            itemType,
            items,
            serverId,
            t,
        ],
    );

    const handleOpenModal = useCallback(() => {
        const modalProps: {
            albumId?: string[];
            artistId?: string[];
            genreId?: string[];
            initialSelectedIds?: string[];
            playlistId?: string[];
            songId?: string[];
        } = {};

        switch (itemType) {
            case LibraryItem.ALBUM:
                modalProps.albumId = items;
                break;
            case LibraryItem.ALBUM_ARTIST:
            case LibraryItem.ARTIST:
                modalProps.artistId = items;
                break;
            case LibraryItem.GENRE:
                modalProps.genreId = items;
                break;
            case LibraryItem.PLAYLIST:
                modalProps.playlistId = items;
                break;
            case LibraryItem.PLAYLIST_SONG:
            case LibraryItem.QUEUE_SONG:
            case LibraryItem.SONG:
                modalProps.songId = items;
                break;
            default:
                return;
        }

        openContextModal({
            innerProps: {
                itemIds: items,
                resourceType: itemType,
            },
            modalKey: 'addToPlaylist',
            size: 'lg',
            title: t('page.contextMenu.addToPlaylist', { postProcess: 'sentenceCase' }),
        });
    }, [itemType, items, t]);

    if (items.length === 0) return null;

    const searchInput = (
        <TextInput
            autoFocus
            leftSection={<Icon icon="search" />}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            pb="xs"
            placeholder={t('common.search', { postProcess: 'sentenceCase' })}
            size="sm"
            value={searchTerm}
        />
    );

    return (
        <ContextMenu.Submenu isCloseDisabled>
            <ContextMenu.SubmenuTarget>
                <ContextMenu.Item
                    leftIcon="playlist"
                    onSelect={handleOpenModal}
                    rightIcon="arrowRightS"
                >
                    {t('page.contextMenu.addToPlaylist', { postProcess: 'sentenceCase' })}
                </ContextMenu.Item>
            </ContextMenu.SubmenuTarget>
            <ContextMenu.SubmenuContent stickyContent={searchInput}>
                {playlistsQuery.isLoading && (
                    <ContextMenu.Item disabled>
                        <Spinner container />
                    </ContextMenu.Item>
                )}
                {playlistsQuery.isError && (
                    <ContextMenu.Item disabled>
                        {t('error.genericError', { postProcess: 'sentenceCase' })}
                    </ContextMenu.Item>
                )}
                {recentPlaylist && (
                    <>
                        <ContextMenu.Item
                            key={recentPlaylist.id}
                            onSelect={() => handleAddToPlaylist(recentPlaylist.id)}
                        >
                            {recentPlaylist.name}
                        </ContextMenu.Item>
                        {filteredPlaylists.length > 0 && <ContextMenu.Divider />}
                    </>
                )}
                {filteredPlaylists.length === 0 && !playlistsQuery.isLoading && (
                    <ContextMenu.Item disabled>
                        {t('common.noResultsFromQuery', { postProcess: 'sentenceCase' })}
                    </ContextMenu.Item>
                )}
                {filteredPlaylists.map((playlist) => (
                    <ContextMenu.Item
                        key={playlist.id}
                        onSelect={() => handleAddToPlaylist(playlist.id)}
                    >
                        {playlist.name}
                    </ContextMenu.Item>
                ))}
            </ContextMenu.SubmenuContent>
        </ContextMenu.Submenu>
    );
};
