import { useQuery } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import { ChangeEvent, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
    MultiSelectWithInvalidData,
    SelectWithInvalidData,
} from '/@/renderer/components/select-with-invalid-data';
import { useAlbumListFilters } from '/@/renderer/features/albums/hooks/use-album-list-filters';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import { genresQueries } from '/@/renderer/features/genres/api/genres-api';
import { sharedQueries } from '/@/renderer/features/shared/api/shared-api';
import { useCurrentServer } from '/@/renderer/store';
import { NDSongQueryFields } from '/@/shared/api/navidrome.types';
import { hasFeature } from '/@/shared/api/utils';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { SpinnerIcon } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { Text } from '/@/shared/components/text/text';
import { YesNoSelect } from '/@/shared/components/yes-no-select/yes-no-select';
import {
    AlbumArtistListSort,
    GenreListSort,
    LibraryItem,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ServerFeature } from '/@/shared/types/features-types';

interface NavidromeAlbumFiltersProps {
    disableArtistFilter?: boolean;
}

export const NavidromeAlbumFilters = ({ disableArtistFilter }: NavidromeAlbumFiltersProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const serverId = server.id;

    const {
        query,
        setAlbumArtist,
        setCompilation,
        setCustom,
        setFavorite,
        setGenreId,
        setHasRating,
        setMaxYear,
        setMinYear,
        setRecentlyPlayed,
    } = useAlbumListFilters();

    const genreListQuery = useQuery(
        genresQueries.list({
            options: {
                gcTime: 1000 * 60 * 2,
                staleTime: 1000 * 60 * 1,
            },
            query: {
                sortBy: GenreListSort.NAME,
                sortOrder: SortOrder.ASC,
                startIndex: 0,
            },
            serverId,
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
            options: {
                gcTime: 1000 * 60 * 2,
                staleTime: 1000 * 60 * 1,
            },
            query: {
                type: LibraryItem.ALBUM,
            },
            serverId,
        }),
    );

    const yesNoUndefinedFilters = [
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
    ];

    const toggleFilters = [
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
            value: query.recentlyPlayed,
        },
    ];

    const handleYearFilter = debounce((e: number | string) => {
        const year = e === '' ? undefined : (e as number);
        setMinYear(year ?? null);
        setMaxYear(year ?? null);
    }, 500);

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
    }, [albumArtistListQuery?.data?.items]);

    const handleTagFilter = debounce((tag: string, e: null | string) => {
        setCustom((prev) => ({
            ...prev,
            [tag]: e || undefined,
        }));
    }, 250);

    const hasBFR = hasFeature(server, ServerFeature.BFR);

    return (
        <Stack p="0.8rem">
            {yesNoUndefinedFilters.map((filter) => (
                <Group justify="space-between" key={`nd-filter-${filter.label}`}>
                    <Text>{filter.label}</Text>
                    <YesNoSelect
                        onChange={filter.onChange}
                        size="xs"
                        value={filter.value ?? undefined}
                    />
                </Group>
            ))}
            {toggleFilters.map((filter) => (
                <Group justify="space-between" key={`nd-filter-${filter.label}`}>
                    <Text>{filter.label}</Text>
                    <Switch checked={filter?.value ?? false} onChange={filter.onChange} />
                </Group>
            ))}
            <Divider my="0.5rem" />
            <Group grow>
                <NumberInput
                    defaultValue={query.minYear ?? undefined}
                    hideControls={false}
                    label={t('common.year', { postProcess: 'titleCase' })}
                    max={5000}
                    min={0}
                    onChange={(e) => handleYearFilter(e)}
                />
                <SelectWithInvalidData
                    clearable
                    data={genreList}
                    defaultValue={query.genreId ? query.genreId[0] : undefined}
                    label={t('entity.genre', { count: 1, postProcess: 'titleCase' })}
                    onChange={(e) => (e ? setGenreId([e]) : undefined)}
                    searchable
                />
            </Group>
            {hasBFR && (
                <Group grow>
                    <MultiSelectWithInvalidData
                        clearable
                        data={genreList}
                        defaultValue={query.genres}
                        label={t('entity.genre', { count: 2, postProcess: 'sentenceCase' })}
                        onChange={(e) => (e ? setAlbumGenre(e) : undefined)}
                        searchable
                    />
                </Group>
            )}
            <Group grow>
                <SelectWithInvalidData
                    clearable
                    data={selectableAlbumArtists}
                    defaultValue={query.artistIds ? query.artistIds[0] : undefined}
                    disabled={disableArtistFilter}
                    label={t('entity.artist', { count: 1, postProcess: 'titleCase' })}
                    limit={300}
                    onChange={(e) => setAlbumArtist(e ? [e] : null)}
                    rightSection={albumArtistListQuery.isFetching ? <SpinnerIcon /> : undefined}
                    searchable
                />
            </Group>
            {tagsQuery.data?.enumTags?.length &&
                tagsQuery.data.enumTags.length > 0 &&
                tagsQuery.data.enumTags.map((tag) => (
                    <Group grow key={tag.name}>
                        <SelectWithInvalidData
                            clearable
                            data={tag.options}
                            defaultValue={query._custom?.[tag.name] as string | undefined}
                            label={
                                NDSongQueryFields.find((i) => i.value === tag.name)?.label ||
                                tag.name
                            }
                            onChange={(value) => handleTagFilter(tag.name, value)}
                            searchable
                            width={150}
                        />
                    </Group>
                ))}
        </Stack>
    );
};
