import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { ChangeEvent, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { MultiSelectWithInvalidData } from '/@/renderer/components/select-with-invalid-data';
import { useListContext } from '/@/renderer/context/list-context';
import { useAlbumListFilters } from '/@/renderer/features/albums/hooks/use-album-list-filters';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import { useGenreList } from '/@/renderer/features/genres/api/genres-api';
import { sharedQueries } from '/@/renderer/features/shared/api/shared-api';
import { useCurrentServer, useCurrentServerId } from '/@/renderer/store';
import { titleCase } from '/@/renderer/utils';
import { NDSongQueryFieldsLabelMap } from '/@/shared/api/navidrome/navidrome-types';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { SpinnerIcon } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { Text } from '/@/shared/components/text/text';
import { YesNoSelect } from '/@/shared/components/yes-no-select/yes-no-select';
import { useDebouncedCallback } from '/@/shared/hooks/use-debounced-callback';
import { AlbumArtistListSort, LibraryItem, SortOrder } from '/@/shared/types/domain-types';

interface NavidromeAlbumFiltersProps {
    disableArtistFilter?: boolean;
}

export const NavidromeAlbumFilters = ({ disableArtistFilter }: NavidromeAlbumFiltersProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const serverId = server.id;

    const { customFilters } = useListContext();

    const isGenrePage = customFilters?.genreIds !== undefined;

    const {
        query,
        setAlbumArtist,
        setCompilation,
        setFavorite,
        setGenreId,
        setHasRating,
        setMaxYear,
        setMinYear,
        setRecentlyPlayed,
    } = useAlbumListFilters();

    const genreListQuery = useGenreList();

    const genreList = useMemo(() => {
        if (!genreListQuery?.data) return [];
        return genreListQuery.data.items.map((genre) => ({
            label: genre.name,
            value: genre.id,
        }));
    }, [genreListQuery.data]);

    const yesNoUndefinedFilters = useMemo(
        () => [
            {
                label: t('filter.isFavorited', { postProcess: 'sentenceCase' }),
                onChange: (favorite?: boolean) => {
                    setFavorite(favorite ?? null);
                },
                value: query.favorite,
            },
            {
                label: t('filter.isCompilation', { postProcess: 'sentenceCase' }),
                onChange: (compilation?: boolean) => {
                    setCompilation(compilation ?? null);
                },
                value: query.compilation,
            },
        ],
        [t, query.favorite, query.compilation, setFavorite, setCompilation],
    );

    const toggleFilters = useMemo(
        () => [
            {
                label: t('filter.isRated', { postProcess: 'sentenceCase' }),
                onChange: (e: ChangeEvent<HTMLInputElement>) => {
                    const hasRating = e.currentTarget.checked ? true : undefined;
                    setHasRating(hasRating ?? null);
                },
                value: query.hasRating,
            },
            {
                label: t('filter.isRecentlyPlayed', { postProcess: 'sentenceCase' }),
                onChange: (e: ChangeEvent<HTMLInputElement>) => {
                    const recentlyPlayed = e.currentTarget.checked ? true : undefined;
                    setRecentlyPlayed(recentlyPlayed ?? null);
                },
                value: query.isRecentlyPlayed,
            },
        ],
        [t, query.hasRating, query.isRecentlyPlayed, setHasRating, setRecentlyPlayed],
    );

    const handleYearFilter = useMemo(
        () => (e: number | string) => {
            // Handle empty string, null, undefined, or invalid numbers as clearing

            if (e === '' || e === null || e === undefined) {
                setMinYear(null);
                setMaxYear(null);
                return;
            }

            const year = typeof e === 'number' ? e : Number(e);
            // If it's a valid number, set it; otherwise clear
            if (!isNaN(year) && isFinite(year) && year > 0) {
                setMinYear(year);
                setMaxYear(year);
            } else {
                setMinYear(null);
                setMaxYear(null);
            }
        },
        [setMinYear, setMaxYear],
    );

    const albumArtistListQuery = useQuery(
        artistsQueries.albumArtistList({
            options: {
                gcTime: 1000 * 60 * 2,
                staleTime: 1000 * 60 * 1,
            },
            query: {
                sortBy: AlbumArtistListSort.NAME,
                sortOrder: SortOrder.ASC,
                startIndex: 0,
            },
            serverId,
        }),
    );

    const selectableAlbumArtists = useMemo(() => {
        if (!albumArtistListQuery?.data?.items) return [];

        return albumArtistListQuery?.data?.items?.map((artist) => ({
            label: artist.name,
            value: artist.id,
        }));
    }, [albumArtistListQuery.data?.items]);

    const debouncedHandleYearFilter = useDebouncedCallback(handleYearFilter, 300);

    const handleGenreChange = useCallback(
        (e: null | string[]) => {
            if (e && e.length > 0) {
                setGenreId(e);
            } else {
                setGenreId(null);
            }
        },
        [setGenreId],
    );

    const handleAlbumArtistChange = useCallback(
        (e: null | string[]) => {
            if (e && e.length > 0) {
                setAlbumArtist(e);
            } else {
                setAlbumArtist(null);
            }
        },
        [setAlbumArtist],
    );

    return (
        <Stack px="md" py="md">
            {yesNoUndefinedFilters.map((filter) => (
                <YesNoSelect
                    clearable
                    defaultValue={filter.value ? filter.value.toString() : undefined}
                    key={`nd-filter-${filter.label}`}
                    label={filter.label}
                    onChange={(e) => filter.onChange(e ? e === 'true' : undefined)}
                />
            ))}
            {toggleFilters.map((filter) => (
                <Group justify="space-between" key={`nd-filter-${filter.label}`}>
                    <Text>{filter.label}</Text>
                    <Switch defaultChecked={filter?.value ?? false} onChange={filter.onChange} />
                </Group>
            ))}
            <Divider my="md" />
            <NumberInput
                defaultValue={query.minYear ?? undefined}
                hideControls={false}
                label={t('common.year', { postProcess: 'titleCase' })}
                max={5000}
                min={0}
                onChange={(e) => debouncedHandleYearFilter(e)}
            />
            {!isGenrePage && (
                <MultiSelectWithInvalidData
                    clearable
                    data={genreList}
                    defaultValue={query.genreIds || []}
                    label={t('entity.genre', { count: 2, postProcess: 'sentenceCase' })}
                    onChange={handleGenreChange}
                    searchable
                />
            )}
            <MultiSelectWithInvalidData
                clearable
                data={selectableAlbumArtists}
                defaultValue={query.artistIds || []}
                disabled={disableArtistFilter}
                label={t('entity.artist', { count: 2, postProcess: 'sentenceCase' })}
                limit={300}
                onChange={handleAlbumArtistChange}
                rightSection={albumArtistListQuery.isFetching ? <SpinnerIcon /> : undefined}
                searchable
            />
            <Divider my="md" />
            <TagFilters />
        </Stack>
    );
};

interface TagFilterItemProps {
    label: string;
    onChange: (value: null | string[]) => void;
    options: Array<{ id: string; name: string }>;
    tagValue: string;
    value: string | string[] | undefined;
}

const TagFilterItem = ({ label, onChange, options, tagValue, value }: TagFilterItemProps) => {
    const selectData = useMemo(
        () =>
            options.map((option) => ({
                label: option.name,
                value: option.id,
            })),
        [options],
    );

    const defaultValue = useMemo(() => {
        if (!value) return [];
        return Array.isArray(value) ? value : [value];
    }, [value]);

    const handleChange = useCallback(
        (e: null | string[]) => {
            if (e && e.length > 0) {
                onChange(e);
            } else {
                onChange(null);
            }
        },
        [onChange],
    );

    return (
        <MultiSelectWithInvalidData
            clearable
            data={selectData}
            defaultValue={defaultValue}
            key={tagValue}
            label={label}
            limit={100}
            onChange={handleChange}
            searchable
        />
    );
};

TagFilterItem.displayName = 'TagFilterItem';

const TagFilters = () => {
    const { query, setCustom } = useAlbumListFilters();

    const serverId = useCurrentServerId();

    const tagsQuery = useSuspenseQuery(
        sharedQueries.tagList({
            options: {
                gcTime: 1000 * 60 * 60,
                staleTime: 1000 * 60 * 60,
            },
            query: {
                type: LibraryItem.ALBUM,
            },
            serverId,
        }),
    );

    const handleTagFilter = useMemo(
        () => (tag: string, e: null | string[]) => {
            setCustom({ [tag]: e });
        },
        [setCustom],
    );

    const tags = useMemo(() => {
        const results: { label: string; options: { id: string; name: string }[]; value: string }[] =
            [];

        for (const tag of tagsQuery.data?.enumTags || []) {
            if (!tagsQuery.data?.excluded.album.includes(tag.name)) {
                results.push({
                    label: NDSongQueryFieldsLabelMap[tag.name] ?? titleCase(tag.name),
                    options: tag.options,
                    value: tag.name,
                });
            }
        }

        return results;
    }, [tagsQuery.data]);

    return (
        <>
            {tags.map((tag) => (
                <TagFilterItem
                    key={tag.value}
                    label={tag.label}
                    onChange={(e) => handleTagFilter(tag.value, e)}
                    options={tag.options}
                    tagValue={tag.value}
                    value={query._custom?.[tag.value] as string | string[] | undefined}
                />
            ))}
        </>
    );
};
