import { closeAllModals, openContextModal } from '@mantine/modals';
import { queryOptions, useQuery } from '@tanstack/react-query';
import merge from 'lodash/merge';
import { Suspense, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createWithEqualityFn } from 'zustand/traditional';

import i18n from '/@/i18n/i18n';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { useGenreList } from '/@/renderer/features/genres/api/genres-api';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { PlayButtonGroup } from '/@/renderer/features/shared/components/play-button-group';
import { useCurrentServer } from '/@/renderer/store';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Select } from '/@/shared/components/select/select';
import { Stack } from '/@/shared/components/stack/stack';
import {
    AlbumListQuery,
    AlbumListSort,
    LibraryItem,
    Played,
    RandomSongListQuery,
    ServerType,
    SortOrder,
} from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

interface ShuffleAllSlice extends RandomSongListQuery {
    actions: {
        setStore: (data: Partial<ShuffleAllSlice>) => void;
    };
    enableMaxYear: boolean;
    enableMinYear: boolean;
    playbackKind: 'albums' | 'songs';
}

const useShuffleAllStore = createWithEqualityFn<ShuffleAllSlice>()(
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
            limit: 100,
            maxYear: 2020,
            minYear: 2000,
            musicFolder: '',
            playbackKind: 'songs',
            played: Played.All,
        })),
        {
            merge: (persistedState, currentState) => merge(currentState, persistedState),
            migrate: (persisted, version: number) => {
                if (!persisted) {
                    return persisted;
                }

                if (version >= 2) {
                    return persisted;
                }

                return persisted;
            },
            name: 'store_shuffle_all',
            version: 2,
        },
    ),
);

const PLAYED_DATA: { label: string; value: Played }[] = [
    { label: 'all tracks', value: Played.All },
    { label: 'only unplayed tracks', value: Played.Never },
    { label: 'only played tracks', value: Played.Played },
];

export const useShuffleAllStoreActions = () => useShuffleAllStore((state) => state.actions);

export const ShuffleAllContextModal = () => {
    const server = useCurrentServer();
    const { addToQueueByData, addToQueueByFetch } = usePlayer();
    const { t } = useTranslation();
    const {
        enableMaxYear,
        enableMinYear,
        genre,
        limit,
        maxYear,
        minYear,
        musicFolderId,
        playbackKind,
        played,
    } = useShuffleAllStore();
    const { setStore } = useShuffleAllStoreActions();

    const clampedLimit = Math.min(500, Math.max(1, limit || 100));

    const { isFetching: isFetchingSongs, refetch: refetchSongs } = useQuery({
        ...randomFetchQuery({
            query: {
                genre: genre || undefined,
                limit: limit || 100,
                maxYear: enableMaxYear ? maxYear || undefined : undefined,
                minYear: enableMinYear ? minYear || undefined : undefined,
                musicFolderId: musicFolderId || undefined,
                played,
            },
            serverId: server.id,
        }),
        enabled: false,
        gcTime: 0,
        staleTime: 0,
    });

    const { isFetching: isFetchingAlbums, refetch: refetchAlbums } = useQuery({
        ...shuffleAlbumListQuery({
            query: {
                genreIds: genre ? [genre] : undefined,
                limit: clampedLimit,
                minYear: enableMinYear ? minYear || undefined : undefined,
                musicFolderId: musicFolderId || undefined,
                sortBy: AlbumListSort.RANDOM,
                sortOrder: SortOrder.ASC,
                startIndex: 0,
            },
            serverId: server.id,
        }),
        enabled: false,
        gcTime: 0,
        staleTime: 0,
    });

    const fetchTypeRef = useRef<Play>(null);

    const handlePlay = async (playType: Play) => {
        fetchTypeRef.current = playType;

        if (playbackKind === 'albums') {
            const { data } = await refetchAlbums();

            addToQueueByFetch(
                server.id,
                data?.items.map((a) => a.id) ?? [],
                LibraryItem.ALBUM,
                playType,
            );
        } else {
            const { data } = await refetchSongs();

            addToQueueByData(data?.items || [], playType);
        }

        closeAllModals();
    };

    return (
        <Stack gap="md">
            <SegmentedControl
                data={[
                    {
                        label: t('form.shuffleAll.input_kind_songs'),
                        value: 'songs',
                    },
                    {
                        label: t('form.shuffleAll.input_kind_albums'),
                        value: 'albums',
                    },
                ]}
                onChange={(value) =>
                    setStore({
                        playbackKind: value as 'albums' | 'songs',
                    })
                }
                size="sm"
                value={playbackKind}
                w="100%"
            />
            <NumberInput
                label={
                    playbackKind === 'albums'
                        ? t('form.shuffleAll.input_limit_albums')
                        : t('form.shuffleAll.input_limit_songs')
                }
                max={500}
                min={1}
                onChange={(e) => setStore({ limit: e ? Number(e) : 500 })}
                required
                value={limit}
            />
            <Group grow>
                <NumberInput
                    label={t('form.shuffleAll.input_minYear')}
                    max={2050}
                    min={1850}
                    onChange={(e) => setStore({ minYear: e ? Number(e) : 0 })}
                    rightSection={
                        <Checkbox
                            checked={enableMinYear}
                            onChange={(e) => setStore({ enableMinYear: e.currentTarget.checked })}
                            style={{ marginRight: '0.5rem' }}
                        />
                    }
                    value={minYear}
                />
                <NumberInput
                    disabled={playbackKind === 'albums'}
                    label={t('form.shuffleAll.input_maxYear')}
                    max={2050}
                    min={1850}
                    onChange={(e) => setStore({ maxYear: e ? Number(e) : 0 })}
                    rightSection={
                        <Checkbox
                            checked={enableMaxYear}
                            disabled={playbackKind === 'albums'}
                            onChange={(e) => setStore({ enableMaxYear: e.currentTarget.checked })}
                            style={{ marginRight: '0.5rem' }}
                        />
                    }
                    value={maxYear}
                />
            </Group>
            <Suspense fallback={<Select data={[]} />}>
                <GenreSelect />
            </Suspense>
            {server?.type === ServerType.JELLYFIN && playbackKind === 'songs' && (
                <Select
                    clearable
                    data={PLAYED_DATA}
                    label={t('form.shuffleAll.input_played')}
                    onChange={(e) => {
                        setStore({ played: e as Played });
                    }}
                    value={played}
                />
            )}
            <Divider />
            <PlayButtonGroup loading={isFetchingSongs || isFetchingAlbums} onPlay={handlePlay} />
        </Stack>
    );
};

const randomFetchQuery = (args: {
    query: {
        genre?: string;
        limit: number;
        maxYear?: number;
        minYear?: number;
        musicFolderId?: string | string[];
        played: Played;
    };
    serverId: string;
}) => {
    return queryOptions({
        queryFn: async ({ signal }) => {
            return api.controller.getRandomSongList({
                apiClientProps: { serverId: args.serverId, signal },
                query: args.query,
            });
        },
        queryKey: queryKeys.player.fetch(),
    });
};

const shuffleAlbumListQuery = (args: { query: AlbumListQuery; serverId: string }) => {
    return albumQueries.list({
        query: args.query,
        serverId: args.serverId,
    });
};

export const openShuffleAllModal = async () => {
    openContextModal({
        innerProps: {},
        modal: 'shuffleAll',
        size: 'sm',
        title: i18n.t('player.playRandom') as string,
    });
};

const GenreSelect = () => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const { genre } = useShuffleAllStore();
    const { data: genres } = useGenreList();
    const { setStore } = useShuffleAllStoreActions();

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
    }, [genres, server.type]);

    return (
        <Select
            clearable
            data={genreData}
            label={t('form.shuffleAll.input_genre')}
            onChange={(e) => setStore({ genre: e || '' })}
            searchable
            value={genre}
        />
    );
};
