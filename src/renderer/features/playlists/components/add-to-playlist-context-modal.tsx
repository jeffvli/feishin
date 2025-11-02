import { Pill } from '@mantine/core';
import { useSelection } from '@mantine/hooks';
import { closeModal, ContextModalProps } from '@mantine/modals';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { getGenreSongsById } from '/@/renderer/features/player';
import { useAddToPlaylist } from '/@/renderer/features/playlists/mutations/add-to-playlist-mutation';
import { usePlaylistList } from '/@/renderer/features/playlists/queries/playlist-list-query';
import { queryClient } from '/@/renderer/lib/react-query';
import { useCurrentServer } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { Table } from '/@/shared/components/table/table';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import {
    PlaylistListSort,
    SongListQuery,
    SongListSort,
    SortOrder,
} from '/@/shared/types/domain-types';

export const AddToPlaylistContextModal = ({
    id,
    innerProps,
}: ContextModalProps<{
    albumId?: string[];
    artistId?: string[];
    genreId?: string[];
    songId?: string[];
}>) => {
    const { t } = useTranslation();
    const { albumId, artistId, genreId, songId } = innerProps;
    const server = useCurrentServer();
    const [isLoading, setIsLoading] = useState(false);
    const [skipDuplicates, setSkipDuplicates] = useState(true);
    const [search, setSearch] = useState<string>();
    const [newPlaylists, setNewPlaylists] = useState<string[]>([]);

    const addToPlaylistMutation = useAddToPlaylist({});

    const playlistList = usePlaylistList({
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
    });

    const [playlistIds, playlistSelect, playlistMap] = useMemo(() => {
        const ids = new Array<string>();
        const existingPlaylists = new Array<{ label: string; value: string }>();
        const playlistMap = new Map<string, string>();

        for (const playlist of playlistList.data?.items ?? []) {
            ids.push(playlist.id);
            existingPlaylists.push({ label: playlist.name, value: playlist.id });
            playlistMap.set(playlist.id, playlist.name);
        }

        return [ids, existingPlaylists, playlistMap];
    }, [playlistList.data]);

    const [selection, handlers] = useSelection({
        data: playlistIds,
    });

    const filteredItems = useMemo(() => {
        if (search) {
            return playlistSelect.filter((item) =>
                item.label.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
            );
        }

        return playlistSelect;
    }, [playlistSelect, search]);

    const getSongsByAlbum = useCallback(
        async (albumId: string) => {
            const query: SongListQuery = {
                albumIds: [albumId],
                sortBy: SongListSort.ALBUM,
                sortOrder: SortOrder.ASC,
                startIndex: 0,
            };

            const queryKey = queryKeys.songs.list(server?.id || '', query);

            const songsRes = await queryClient.fetchQuery(queryKey, ({ signal }) => {
                if (!server) throw new Error('No server');
                return api.controller.getSongList({ apiClientProps: { server, signal }, query });
            });

            return songsRes;
        },
        [server],
    );

    const getSongsByArtist = useCallback(
        async (artistId: string) => {
            const query: SongListQuery = {
                artistIds: [artistId],
                sortBy: SongListSort.ARTIST,
                sortOrder: SortOrder.ASC,
                startIndex: 0,
            };

            const queryKey = queryKeys.songs.list(server?.id || '', query);

            const songsRes = await queryClient.fetchQuery(queryKey, ({ signal }) => {
                if (!server) throw new Error('No server');
                return api.controller.getSongList({ apiClientProps: { server, signal }, query });
            });

            return songsRes;
        },
        [server],
    );

    const handleSubmit = useCallback(async () => {
        setIsLoading(true);
        const allSongIds: string[] = [];
        let totalUniquesAdded = 0;

        if (albumId && albumId.length > 0) {
            for (const id of albumId) {
                const songs = await getSongsByAlbum(id);
                allSongIds.push(...(songs?.items?.map((song) => song.id) || []));
            }
        }

        if (artistId && artistId.length > 0) {
            for (const id of artistId) {
                const songs = await getSongsByArtist(id);
                allSongIds.push(...(songs?.items?.map((song) => song.id) || []));
            }
        }

        if (genreId && genreId.length > 0) {
            const songs = await getGenreSongsById({
                id: genreId,
                queryClient,
                server,
            });

            allSongIds.push(...(songs?.items?.map((song) => song.id) || []));
        }

        if (songId && songId.length > 0) {
            allSongIds.push(...songId);
        }

        const playlistIds = [...selection];

        if (newPlaylists) {
            for (const playlist of newPlaylists) {
                try {
                    const response = await api.controller.createPlaylist({
                        apiClientProps: { server },
                        body: {
                            name: playlist,
                            public: false,
                        },
                    });

                    if (response?.id) {
                        playlistIds.push(response?.id);
                    }
                } catch (error: any) {
                    toast.error({
                        message: `[${playlist}] ${error?.message}`,
                        title: t('error.genericError', { postProcess: 'sentenceCase' }),
                    });
                }
            }
        }

        for (const playlistId of playlistIds) {
            const uniqueSongIds: string[] = [];

            if (skipDuplicates) {
                const queryKey = queryKeys.playlists.songList(server?.id || '', playlistId);

                const playlistSongsRes = await queryClient.fetchQuery(queryKey, ({ signal }) => {
                    if (!server)
                        throw new Error(
                            t('error.serverNotSelectedError', { postProcess: 'sentenceCase' }),
                        );
                    return api.controller.getPlaylistSongList({
                        apiClientProps: {
                            server,
                            signal,
                        },
                        query: {
                            id: playlistId,
                        },
                    });
                });

                const playlistSongIds = playlistSongsRes?.items?.map((song) => song.id);

                for (const songId of allSongIds) {
                    if (!playlistSongIds?.includes(songId)) {
                        uniqueSongIds.push(songId);
                    }
                }
                totalUniquesAdded += uniqueSongIds.length;
            }

            if (skipDuplicates ? uniqueSongIds.length > 0 : allSongIds.length > 0) {
                if (!server) return null;
                addToPlaylistMutation.mutate(
                    {
                        body: { songId: skipDuplicates ? uniqueSongIds : allSongIds },
                        query: { id: playlistId },
                        serverId: server?.id,
                    },
                    {
                        onError: (err) => {
                            toast.error({
                                message: `[${
                                    playlistSelect.find((playlist) => playlist.value === playlistId)
                                        ?.label
                                }] ${err.message}`,
                                title: t('error.genericError', { postProcess: 'sentenceCase' }),
                            });
                        },
                    },
                );
            }
        }

        const addMessage =
            skipDuplicates && allSongIds.length * playlistIds.length !== totalUniquesAdded
                ? Math.floor(totalUniquesAdded / playlistIds.length)
                : allSongIds.length;

        setIsLoading(false);
        toast.success({
            message: t('form.addToPlaylist.success', {
                message: addMessage,
                numOfPlaylists: playlistIds.length,
                postProcess: 'sentenceCase',
            }),
        });
        closeModal(id);
        return null;
    }, [
        addToPlaylistMutation,
        albumId,
        artistId,
        genreId,
        getSongsByAlbum,
        getSongsByArtist,
        id,
        newPlaylists,
        playlistSelect,
        selection,
        server,
        skipDuplicates,
        songId,
        t,
    ]);

    return (
        <div style={{ padding: '1rem' }}>
            <Stack>
                <TextInput
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t('form.addToPlaylist.searchOrCreate', {
                        postProcess: 'sentenceCase',
                    })}
                    size="lg"
                    value={search}
                />
                <ScrollArea style={{ height: '150px' }}>
                    <Table highlightOnHover>
                        <Table.Tbody>
                            {filteredItems.map((item) => (
                                <Table.Tr
                                    key={item.value}
                                    onClick={() => {
                                        handlers.toggle(item.value);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <Table.Td w={10}>
                                        <Checkbox
                                            checked={selection.includes(item.value)}
                                            onChange={(event) => {
                                                if (event.target.checked) {
                                                    handlers.select(item.value);
                                                } else {
                                                    handlers.deselect(item.value);
                                                }
                                                event.preventDefault();
                                            }}
                                        />
                                    </Table.Td>
                                    <Table.Td>
                                        <Text p={5} size="lg">
                                            {item.label}
                                        </Text>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                            {search && (
                                <Table.Tr
                                    onClick={() => {
                                        setNewPlaylists((playlists) => playlists.concat(search));
                                        setSearch('');
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <Table.Td w={10}>
                                        <Icon icon="add" />
                                    </Table.Td>
                                    <Table.Td>
                                        <Text p={5} size="lg">
                                            Create {search}
                                        </Text>
                                    </Table.Td>
                                </Table.Tr>
                            )}
                        </Table.Tbody>
                    </Table>
                </ScrollArea>
                <Pill.Group>
                    {selection.map((item) => (
                        <Pill
                            key={item}
                            onRemove={() => handlers.deselect(item)}
                            size="lg"
                            withRemoveButton
                        >
                            {playlistMap.get(item)}
                        </Pill>
                    ))}
                    {newPlaylists.map((item, idx) => (
                        <Pill
                            key={idx}
                            onRemove={() =>
                                setNewPlaylists((playlists) =>
                                    playlists.filter((_, existingIdx) => idx !== existingIdx),
                                )
                            }
                            size="lg"
                            withRemoveButton
                        >
                            {item}
                        </Pill>
                    ))}
                </Pill.Group>
                <Switch
                    checked={skipDuplicates}
                    label={t('form.addToPlaylist.input', {
                        context: 'skipDuplicates',
                        postProcess: 'titleCase',
                    })}
                    onChange={(e) => setSkipDuplicates(e.currentTarget.checked)}
                />
                <Group justify="flex-end">
                    <Button
                        disabled={addToPlaylistMutation.isLoading}
                        onClick={() => closeModal(id)}
                        size="md"
                        variant="subtle"
                    >
                        {t('common.cancel', { postProcess: 'titleCase' })}
                    </Button>
                    <Button
                        disabled={
                            addToPlaylistMutation.isLoading ||
                            (selection.length === 0 && newPlaylists.length === 0)
                        }
                        loading={isLoading}
                        onClick={() => handleSubmit()}
                        size="md"
                        type="submit"
                        variant="filled"
                    >
                        {t('common.add', { postProcess: 'titleCase' })}
                    </Button>
                </Group>
            </Stack>
        </div>
    );
};
