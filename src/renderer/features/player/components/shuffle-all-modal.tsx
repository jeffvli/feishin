import { useMemo } from 'react';
import { Divider, Group, SelectItem, Stack } from '@mantine/core';
import { closeAllModals, openModal } from '@mantine/modals';
import { QueryClient } from '@tanstack/react-query';
import merge from 'lodash/merge';
import { RiAddBoxFill, RiPlayFill, RiAddCircleFill } from 'react-icons/ri';
import { Button, Checkbox, NumberInput, Select } from '/@/renderer/components';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
    GenreListResponse,
    RandomSongListQuery,
    MusicFolderListResponse,
    ServerType,
    GenreListSort,
    SortOrder,
    ServerListItem,
    Played,
} from '/@/renderer/api/types';
import { api } from '/@/renderer/api';
import { useAuthStore } from '/@/renderer/store';
import { queryKeys } from '/@/renderer/api/query-keys';
import { Play, PlayQueueAddOptions } from '/@/renderer/types';
import i18n from '/@/i18n/i18n';

interface ShuffleAllSlice extends RandomSongListQuery {
    actions: {
        setStore: (data: Partial<ShuffleAllSlice>) => void;
    };
    enableMaxYear: boolean;
    enableMinYear: boolean;
}

const useShuffleAllStore = create<ShuffleAllSlice>()(
    persist(
        immer((set, get) => ({
            actions: {
                setStore: (data) => {
                    set({ ...get(), ...data });
                },
            },
            enableMaxYear: false,
            enableMinYear: false,
            genre: '',
            maxYear: 2020,
            minYear: 2000,
            musicFolder: '',
            played: Played.All,
            songCount: 100,
        })),
        {
            merge: (persistedState, currentState) => merge(currentState, persistedState),
            name: 'store_shuffle_all',
            version: 1,
        },
    ),
);

const PLAYED_DATA: SelectItem[] = [
    { label: 'all tracks', value: Played.All },
    { label: 'only unplayed tracks', value: Played.Never },
    { label: 'only played tracks', value: Played.Played },
];

export const useShuffleAllStoreActions = () => useShuffleAllStore((state) => state.actions);

interface ShuffleAllModalProps {
    genres: GenreListResponse | undefined;
    handlePlayQueueAdd: ((options: PlayQueueAddOptions) => void) | undefined;
    musicFolders: MusicFolderListResponse | undefined;
    queryClient: QueryClient;
    server: ServerListItem | null;
}

export const ShuffleAllModal = ({
    handlePlayQueueAdd,
    queryClient,
    server,
    genres,
    musicFolders,
}: ShuffleAllModalProps) => {
    const { genre, limit, maxYear, minYear, enableMaxYear, enableMinYear, musicFolderId, played } =
        useShuffleAllStore();
    const { setStore } = useShuffleAllStoreActions();

    const handlePlay = async (playType: Play) => {
        const res = await queryClient.fetchQuery({
            cacheTime: 0,
            queryFn: ({ signal }) =>
                api.controller.getRandomSongList({
                    apiClientProps: {
                        server,
                        signal,
                    },
                    query: {
                        genre: genre || undefined,
                        limit,
                        maxYear: enableMaxYear ? maxYear || undefined : undefined,
                        minYear: enableMinYear ? minYear || undefined : undefined,
                        musicFolderId: musicFolderId || undefined,
                        played,
                    },
                }),
            queryKey: queryKeys.songs.randomSongList(server?.id),
            staleTime: 0,
        });

        handlePlayQueueAdd?.({
            byData: res?.items || [],
            playType,
        });

        closeAllModals();
    };

    const genreData = useMemo(() => {
        if (!genres) return [];

        return genres.items.map((genre) => {
            const value =
                server?.type === ServerType.NAVIDROME || server?.type === ServerType.SUBSONIC
                    ? genre.name
                    : genre.id;
            return {
                label: genre.name,
                value,
            };
        });
    }, [genres, server?.type]);

    const musicFolderData = useMemo(() => {
        if (!musicFolders) return [];
        return musicFolders.items.map((musicFolder) => ({
            label: musicFolder.name,
            value: String(musicFolder.id),
        }));
    }, [musicFolders]);

    return (
        <Stack spacing="md">
            <NumberInput
                required
                label="How many tracks?"
                max={500}
                min={1}
                value={limit}
                onChange={(e) => setStore({ limit: e ? Number(e) : 0 })}
            />
            <Group grow>
                <NumberInput
                    label="From year"
                    max={2050}
                    min={1850}
                    rightSection={
                        <Checkbox
                            checked={enableMinYear}
                            mr="0.5rem"
                            onChange={(e) => setStore({ enableMinYear: e.currentTarget.checked })}
                        />
                    }
                    value={minYear}
                    onChange={(e) => setStore({ minYear: e ? Number(e) : 0 })}
                />

                <NumberInput
                    label="To year"
                    max={2050}
                    min={1850}
                    rightSection={
                        <Checkbox
                            checked={enableMaxYear}
                            mr="0.5rem"
                            onChange={(e) => setStore({ enableMaxYear: e.currentTarget.checked })}
                        />
                    }
                    value={maxYear}
                    onChange={(e) => setStore({ maxYear: e ? Number(e) : 0 })}
                />
            </Group>
            <Select
                clearable
                data={genreData}
                label="Genre"
                value={genre}
                onChange={(e) => setStore({ genre: e || '' })}
            />
            <Select
                clearable
                data={musicFolderData}
                label="Music folder"
                value={musicFolderId}
                onChange={(e) => {
                    setStore({ musicFolderId: e ? String(e) : '' });
                }}
            />
            {server?.type === ServerType.JELLYFIN && (
                <Select
                    clearable
                    data={PLAYED_DATA}
                    label="Play filter"
                    value={played}
                    onChange={(e) => {
                        setStore({ played: e as Played });
                    }}
                />
            )}
            <Divider />
            <Group grow>
                <Button
                    leftIcon={<RiAddBoxFill size="1rem" />}
                    type="submit"
                    variant="default"
                    onClick={() => handlePlay(Play.LAST)}
                >
                    Add
                </Button>
                <Button
                    leftIcon={<RiAddCircleFill size="1rem" />}
                    type="submit"
                    variant="default"
                    onClick={() => handlePlay(Play.NEXT)}
                >
                    Add next
                </Button>
            </Group>
            <Button
                leftIcon={<RiPlayFill size="1rem" />}
                type="submit"
                variant="filled"
                onClick={() => handlePlay(Play.NOW)}
            >
                Play
            </Button>
        </Stack>
    );
};

export const openShuffleAllModal = async (
    props: Pick<ShuffleAllModalProps, 'handlePlayQueueAdd' | 'queryClient'>,
) => {
    const server = useAuthStore.getState().currentServer;

    const genres = await props.queryClient.fetchQuery({
        cacheTime: 1000 * 60 * 60 * 4,
        queryFn: ({ signal }) =>
            api.controller.getGenreList({
                apiClientProps: {
                    server,
                    signal,
                },
                query: {
                    sortBy: GenreListSort.NAME,
                    sortOrder: SortOrder.ASC,
                    startIndex: 0,
                },
            }),
        queryKey: queryKeys.genres.list(server?.id),
        staleTime: 1000 * 60 * 5,
    });

    const musicFolders = await props.queryClient.fetchQuery({
        cacheTime: 1000 * 60 * 60 * 4,
        queryFn: ({ signal }) =>
            api.controller.getMusicFolderList({
                apiClientProps: {
                    server,
                    signal,
                },
            }),
        queryKey: queryKeys.musicFolders.list(server?.id),
        staleTime: 1000 * 60 * 5,
    });

    openModal({
        children: (
            <ShuffleAllModal
                genres={genres}
                musicFolders={musicFolders}
                server={server}
                {...props}
            />
        ),
        size: 'sm',
        title: i18n.t('player.playRandom', { postProcess: 'sentenceCase' }) as string,
    });
};
