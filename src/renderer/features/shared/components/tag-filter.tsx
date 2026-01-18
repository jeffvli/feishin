import { useSuspenseQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { MultiSelectWithInvalidData } from '/@/renderer/components/select-with-invalid-data';
import { sharedQueries } from '/@/renderer/features/shared/api/shared-api';
import { useCurrentServerId } from '/@/renderer/store';
import { titleCase } from '/@/renderer/utils';
import { NDSongQueryFieldsLabelMap } from '/@/shared/api/navidrome/navidrome-types';
import { LibraryItem } from '/@/shared/types/domain-types';

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

interface TagFiltersProps {
    query: Record<string, any | undefined>;
    setCustom: (value: null | Record<string, any>) => void;
    type: LibraryItem.ALBUM | LibraryItem.SONG;
}

export const TagFilters = ({ query, setCustom, type }: TagFiltersProps) => {
    const serverId = useCurrentServerId();

    const tagsQuery = useSuspenseQuery(
        sharedQueries.tagList({
            options: {
                gcTime: 1000 * 60 * 60,
                staleTime: 1000 * 60 * 60,
            },
            query: { type },
            serverId,
        }),
    );

    const handleTagFilter = useMemo(
        () => (tag: string, e: null | string[]) => {
            setCustom({ [tag]: e || undefined });
        },
        [setCustom],
    );

    const enumTags = useMemo(() => {
        const results: { label: string; options: { id: string; name: string }[]; value: string }[] =
            [];

        const excluded =
            type === LibraryItem.ALBUM
                ? tagsQuery.data?.excluded.album
                : tagsQuery.data?.excluded.song;

        for (const tag of tagsQuery.data?.tags || []) {
            if (!excluded.includes(tag.name)) {
                results.push({
                    label: NDSongQueryFieldsLabelMap[tag.name] ?? titleCase(tag.name),
                    options: tag.options,
                    value: tag.name,
                });
            }
        }

        return results;
    }, [tagsQuery.data?.tags, tagsQuery.data?.excluded.album, tagsQuery.data?.excluded.song, type]);

    return (
        <>
            {enumTags.map((tag) => (
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
