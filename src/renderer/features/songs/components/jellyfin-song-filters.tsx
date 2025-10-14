import { useQuery } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { MultiSelectWithInvalidData } from '/@/renderer/components/select-with-invalid-data';
import { genresQueries } from '/@/renderer/features/genres/api/genres-api';
import { sharedQueries } from '/@/renderer/features/shared/api/shared-api';
import { useSongListFilters } from '/@/renderer/features/songs/hooks/use-song-list-filters';
import { SongListFilter, useCurrentServer } from '/@/renderer/store';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { YesNoSelect } from '/@/shared/components/yes-no-select/yes-no-select';
import { GenreListSort, LibraryItem, SortOrder } from '/@/shared/types/domain-types';

interface JellyfinSongFiltersProps {
    customFilters?: Partial<SongListFilter>;
}

export const JellyfinSongFilters = ({ customFilters }: JellyfinSongFiltersProps) => {
    const server = useCurrentServer();
    const { t } = useTranslation();
    const { query, setCustom, setFavorite, setMaxYear, setMinYear } = useSongListFilters();

    const isGenrePage = customFilters?.genreIds !== undefined;

    // Despite the fact that getTags returns genres, it only returns genre names.
    // We prefer using IDs, hence the double query
    const genreListQuery = useQuery(
        genresQueries.list({
            query: {
                musicFolderId: query.musicFolderId,
                sortBy: GenreListSort.NAME,
                sortOrder: SortOrder.ASC,
                startIndex: 0,
            },
            serverId: server.id,
        }),
    );

    const genreList = useMemo(() => {
        if (!genreListQuery?.data) return [];
        return genreListQuery.data.items.map((genre) => ({
            label: genre.name,
            value: genre.id,
        }));
    }, [genreListQuery.data]);

    const tagsQuery = useQuery(
        sharedQueries.tags({
            query: {
                folder: query.musicFolderId,
                type: LibraryItem.SONG,
            },
            serverId: server.id,
        }),
    );

    const selectedGenres = useMemo(() => {
        return query._custom?.GenreIds?.split(',');
    }, [query._custom?.GenreIds]);

    const selectedTags = useMemo(() => {
        return query._custom?.Tags?.split('|');
    }, [query._custom?.Tags]);

    const yesNoFilters = [
        {
            label: t('filter.isFavorited', { postProcess: 'sentenceCase' }),
            onChange: (favorite: boolean | undefined) => {
                setFavorite(favorite ?? null);
            },
            value: query.favorite,
        },
    ];

    const handleMinYearFilter = debounce((e: number | string) => {
        if (typeof e === 'number' && (e < 1700 || e > 2300)) return;
        setMinYear(e === '' ? null : (e as number));
    }, 500);

    const handleMaxYearFilter = debounce((e: number | string) => {
        if (typeof e === 'number' && (e < 1700 || e > 2300)) return;
        setMaxYear(e === '' ? null : (e as number));
    }, 500);

    const handleGenresFilter = debounce((e: string[] | undefined) => {
        setCustom((prev) => ({
            ...prev,
            GenreIds: e?.join(',') || undefined,
            IncludeItemTypes: 'Audio',
            ...prev?.jellyfin,
        }));
    }, 250);

    const handleTagFilter = debounce((e: string[] | undefined) => {
        setCustom((prev) => ({
            ...prev,
            IncludeItemTypes: 'Audio',
            Tags: e?.join('|') || undefined,
            ...prev?.jellyfin,
        }));
    }, 250);

    return (
        <Stack p="0.8rem">
            {yesNoFilters.map((filter) => (
                <Group justify="space-between" key={`nd-filter-${filter.label}`}>
                    <Text>{filter.label}</Text>
                    <YesNoSelect onChange={filter.onChange} size="xs" value={filter.value} />
                </Group>
            ))}
            <Divider my="0.5rem" />
            <Group grow>
                <NumberInput
                    defaultValue={query.minYear}
                    label={t('filter.fromYear', { postProcess: 'sentenceCase' })}
                    max={2300}
                    min={1700}
                    onChange={handleMinYearFilter}
                    required={!!query.minYear}
                />
                <NumberInput
                    defaultValue={query.maxYear}
                    label={t('filter.toYear', { postProcess: 'sentenceCase' })}
                    max={2300}
                    min={1700}
                    onChange={handleMaxYearFilter}
                    required={!!query.minYear}
                />
            </Group>
            {!isGenrePage && (
                <Group grow>
                    <MultiSelectWithInvalidData
                        clearable
                        data={genreList}
                        defaultValue={selectedGenres}
                        label={t('entity.genre', { count: 1, postProcess: 'sentenceCase' })}
                        onChange={handleGenresFilter}
                        searchable
                        width={250}
                    />
                </Group>
            )}
            {tagsQuery.data?.boolTags && tagsQuery.data.boolTags.length > 0 && (
                <Group grow>
                    <MultiSelectWithInvalidData
                        clearable
                        data={tagsQuery.data.boolTags}
                        defaultValue={selectedTags}
                        label={t('common.tags', { postProcess: 'sentenceCase' })}
                        onChange={handleTagFilter}
                        searchable
                        width={250}
                    />
                </Group>
            )}
        </Stack>
    );
};
