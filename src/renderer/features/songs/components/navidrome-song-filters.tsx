import { useSuspenseQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
    MultiSelectWithInvalidData,
    SelectWithInvalidData,
} from '/@/renderer/components/select-with-invalid-data';
import { useListContext } from '/@/renderer/context/list-context';
import { useGenreList } from '/@/renderer/features/genres/api/genres-api';
import { sharedQueries } from '/@/renderer/features/shared/api/shared-api';
import { useSongListFilters } from '/@/renderer/features/songs/hooks/use-song-list-filters';
import { useCurrentServerId } from '/@/renderer/store';
import { titleCase } from '/@/renderer/utils';
import { NDSongQueryFieldsLabelMap } from '/@/shared/api/navidrome/navidrome-types';
import { Divider } from '/@/shared/components/divider/divider';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Stack } from '/@/shared/components/stack/stack';
import { YesNoSelect } from '/@/shared/components/yes-no-select/yes-no-select';
import { useDebouncedCallback } from '/@/shared/hooks/use-debounced-callback';
import { LibraryItem } from '/@/shared/types/domain-types';

export const NavidromeSongFilters = () => {
    const { t } = useTranslation();
    const { query, setFavorite, setGenreId, setMaxYear, setMinYear } = useSongListFilters();

    const { customFilters } = useListContext();

    const isGenrePage = customFilters?.genreIds !== undefined;

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
        ],
        [t, query.favorite, setFavorite],
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

    const debouncedHandleYearFilter = useDebouncedCallback(handleYearFilter, 300);

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
                    onChange={(e) => (e && e.length > 0 ? setGenreId(e) : setGenreId(null))}
                    searchable
                />
            )}
            <Divider my="md" />
            <TagFilters />
        </Stack>
    );
};

interface TagFilterItemProps {
    label: string;
    onChange: (value: null | string) => void;
    options: Array<{ id: string; name: string }>;
    tagValue: string;
    value: string | undefined;
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

    return (
        <SelectWithInvalidData
            clearable
            data={selectData}
            defaultValue={value}
            key={tagValue}
            label={label}
            limit={100}
            onChange={onChange}
            searchable
        />
    );
};

TagFilterItem.displayName = 'TagFilterItem';

const TagFilters = () => {
    const { query, setCustom } = useSongListFilters();

    const serverId = useCurrentServerId();

    const tagsQuery = useSuspenseQuery(
        sharedQueries.tagList({
            query: { type: LibraryItem.SONG },
            serverId,
        }),
    );

    const handleTagFilter = useMemo(
        () => (tag: string, e: null | string) => {
            setCustom({ [tag]: e });
        },
        [setCustom],
    );

    const tags = useMemo(() => {
        const results: { label: string; options: { id: string; name: string }[]; value: string }[] =
            [];

        for (const tag of tagsQuery.data?.enumTags || []) {
            if (!tagsQuery.data?.excluded.song.includes(tag.name)) {
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
                    value={query._custom?.[tag.value] as string | undefined}
                />
            ))}
        </>
    );
};
