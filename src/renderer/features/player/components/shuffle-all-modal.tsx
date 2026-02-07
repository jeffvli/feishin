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
import { useGenreList } from '/@/renderer/features/genres/api/genres-api';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { PlayButtonGroup } from '/@/renderer/features/shared/components/play-button-group';
import { useCurrentServer } from '/@/renderer/store';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Select } from '/@/shared/components/select/select';
import { Stack } from '/@/shared/components/stack/stack';
import { Played, RandomSongListQuery, ServerType } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

interface ShuffleAllSlice extends RandomSongListQuery {
    actions: {
        setStore: (data: Partial<ShuffleAllSlice>) => void;
    };
    enableMaxYear: boolean;
    enableMinYear: boolean;
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

const PLAYED_DATA: { label: string; value: Played }[] = [
    { label: 'all tracks', value: Played.All },
    { label: 'only unplayed tracks', value: Played.Never },
    { label: 'only played tracks', value: Played.Played },
];

export const useShuffleAllStoreActions = () => useShuffleAllStore((state) => state.actions);

export const ShuffleAllContextModal = () => {
    const server = useCurrentServer();
    const { addToQueueByData } = usePlayer();
    const { t } = useTranslation();
    const { enableMaxYear, enableMinYear, genre, limit, maxYear, minYear, musicFolderId, played } =
        useShuffleAllStore();
    const { setStore } = useShuffleAllStoreActions();

    const { isFetching, refetch } = useQuery({
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

    const fetchTypeRef = useRef<Play>(null);

    const handlePlay = async (playType: Play) => {
        fetchTypeRef.current = playType;

        const { data } = await refetch();

        addToQueueByData(data?.items || [], playType);

        closeAllModals();
    };

    return (
        <Stack gap="md">
            <NumberInput
                label={t('form.shuffleAll.input_limit', { postProcess: 'sentenceCase' })}
                max={500}
                min={1}
                onChange={(e) => setStore({ limit: e ? Number(e) : 500 })}
                required
                value={limit}
            />
            <Group grow>
                <NumberInput
                    label={t('form.shuffleAll.input_minYear', { postProcess: 'sentenceCase' })}
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
                    label={t('form.shuffleAll.input_maxYear', { postProcess: 'sentenceCase' })}
                    max={2050}
                    min={1850}
                    onChange={(e) => setStore({ maxYear: e ? Number(e) : 0 })}
                    rightSection={
                        <Checkbox
                            checked={enableMaxYear}
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
            {server?.type === ServerType.JELLYFIN && (
                <Select
                    clearable
                    data={PLAYED_DATA}
                    label={t('form.shuffleAll.input_played', { postProcess: 'sentenceCase' })}
                    onChange={(e) => {
                        setStore({ played: e as Played });
                    }}
                    value={played}
                />
            )}
            <Divider />
            <PlayButtonGroup
                loading={(isFetching && fetchTypeRef.current) || false}
                onPlay={handlePlay}
            />
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

export const openShuffleAllModal = async () => {
    openContextModal({
        innerProps: {},
        modalKey: 'shuffleAll',
        size: 'sm',
        title: i18n.t('player.playRandom', { postProcess: 'sentenceCase' }) as string,
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
            label={t('form.shuffleAll.input_genre', { postProcess: 'sentenceCase' })}
            onChange={(e) => setStore({ genre: e || '' })}
            searchable
            value={genre}
        />
    );
};
