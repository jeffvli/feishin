import { useMemo, useState } from 'react';
import { Box, Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { closeModal, ContextModalProps } from '@mantine/modals';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { PlaylistListSort, SongListQuery, SongListSort, SortOrder } from '/@/renderer/api/types';
import { Button, MultiSelect, Switch, toast } from '/@/renderer/components';
import { getGenreSongsById } from '/@/renderer/features/player';
import { useAddToPlaylist } from '/@/renderer/features/playlists/mutations/add-to-playlist-mutation';
import { usePlaylistList } from '/@/renderer/features/playlists/queries/playlist-list-query';
import { queryClient } from '/@/renderer/lib/react-query';
import { useCurrentServer } from '/@/renderer/store';
import { useTranslation } from 'react-i18next';

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

    const playlistSelect = useMemo(() => {
        return (
            playlistList.data?.items?.map((playlist) => ({
                label: playlist.name,
                value: playlist.id,
            })) || []
        );
    }, [playlistList.data]);

    const form = useForm({
        initialValues: {
            playlistId: [],
            skipDuplicates: true,
        },
    });

    const getSongsByAlbum = async (albumId: string) => {
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
    };

    const getSongsByArtist = async (artistId: string) => {
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
    };

    const isSubmitDisabled = form.values.playlistId.length === 0 || addToPlaylistMutation.isLoading;

    const handleSubmit = form.onSubmit(async (values) => {
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

        for (const playlistId of values.playlistId) {
            const uniqueSongIds: string[] = [];

            if (values.skipDuplicates) {
                const query = {
                    id: playlistId,
                    startIndex: 0,
                };

                const queryKey = queryKeys.playlists.songList(server?.id || '', playlistId, query);

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
                            sortBy: SongListSort.ID,
                            sortOrder: SortOrder.ASC,
                            startIndex: 0,
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

            if (values.skipDuplicates ? uniqueSongIds.length > 0 : allSongIds.length > 0) {
                if (!server) return null;
                addToPlaylistMutation.mutate(
                    {
                        body: { songId: values.skipDuplicates ? uniqueSongIds : allSongIds },
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
            values.skipDuplicates &&
            allSongIds.length * values.playlistId.length !== totalUniquesAdded
                ? Math.floor(totalUniquesAdded / values.playlistId.length)
                : allSongIds.length;

        setIsLoading(false);
        toast.success({
            message: t('form.addToPlaylist.success', {
                message: addMessage,
                numOfPlaylists: values.playlistId.length,
                postProcess: 'sentenceCase',
            }),
        });
        closeModal(id);
        return null;
    });

    return (
        <Box p="1rem">
            <form onSubmit={handleSubmit}>
                <Stack>
                    <MultiSelect
                        clearable
                        searchable
                        data={playlistSelect}
                        disabled={playlistList.isLoading}
                        label={t('form.addToPlaylist.input', {
                            context: 'playlists',
                            postProcess: 'titleCase',
                        })}
                        size="md"
                        {...form.getInputProps('playlistId')}
                    />
                    <Switch
                        label={t('form.addToPlaylist.input', {
                            context: 'skipDuplicates',
                            postProcess: 'titleCase',
                        })}
                        {...form.getInputProps('skipDuplicates', { type: 'checkbox' })}
                    />
                    <Group position="right">
                        <Group>
                            <Button
                                disabled={addToPlaylistMutation.isLoading}
                                size="md"
                                variant="subtle"
                                onClick={() => closeModal(id)}
                            >
                                {t('common.cancel', { postProcess: 'titleCase' })}
                            </Button>
                            <Button
                                disabled={isSubmitDisabled}
                                loading={isLoading}
                                size="md"
                                type="submit"
                                variant="filled"
                            >
                                {t('common.add', { postProcess: 'titleCase' })}
                            </Button>
                        </Group>
                    </Group>
                </Stack>
            </form>
        </Box>
    );
};
