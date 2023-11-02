import { Box } from '@mantine/core';
import { closeModal, ContextModalProps } from '@mantine/modals';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { SongListQuery, SongListSort, SortOrder } from '/@/renderer/api/types';
import { ConfirmModal, toast } from '/@/renderer/components';
import { getGenreSongsById } from '/@/renderer/features/player';
import { queryClient } from '/@/renderer/lib/react-query';
import { useCurrentServer } from '/@/renderer/store';
import { useTranslation } from 'react-i18next';
import { useDeleteSong } from '/@/renderer/features/songs/mutations/delete-song-mutation';

export const DeleteSongContextModal = ({
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
    console.log('lajp pending ids');
    console.log(songId?.length);
    const server = useCurrentServer();

    const deleteSongMutation = useDeleteSong({});

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

    const handleSubmit = async () => {
        const allSongIds: string[] = [];

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

        if (!server) return null;
        deleteSongMutation.mutate(
            {
                body: { songId: allSongIds, user: server.username },
                query: null,
                serverId: server?.id,
            },
            {
                onError: (err) => {
                    toast.error({
                        message: `${err.message}`,
                        title: t('error.genericError', { postProcess: 'sentenceCase' }),
                    });
                },
                onSuccess: () => {
                    toast.success({
                        message: t('action.deleteSong', {
                            postProcess: 'sentenceCase',
                        }),
                    });
                },
            },
        );

        closeModal(id);
        return null;
    };

    return (
        <Box p="1rem">
            <ConfirmModal
                loading={deleteSongMutation.isLoading}
                onConfirm={handleSubmit}
            >
                Are you sure you want to delete these songs?
            </ConfirmModal>
        </Box>
    );
};
