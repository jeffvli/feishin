import { useSuspenseQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { MultiSelectWithInvalidData } from '/@/renderer/components/select-with-invalid-data';
import { useAlbumListFilters } from '/@/renderer/features/albums/hooks/use-album-list-filters';
import { sharedQueries } from '/@/renderer/features/shared/api/shared-api';
import { useCurrentServerId } from '/@/renderer/store';
import { titleCase } from '/@/renderer/utils';
import { NDSongQueryFieldsLabelMap } from '/@/shared/api/navidrome/navidrome-types';
import { Divider } from '/@/shared/components/divider/divider';
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

export const TagFilters = () => {
    const { t } = useTranslation();
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

    const handleTagsFilter = useCallback(
        (e: null | string[]) => {
            setCustom({ Tags: e && e.length > 0 ? e.join('|') : null });
        },
        [setCustom],
    );

    const handleTagFilter = useMemo(
        () => (tag: string, e: null | string[]) => {
            setCustom({ [tag]: e });
        },
        [setCustom],
    );

    const enumTags = useMemo(() => {
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

    const boolTags = useMemo(() => {
        return tagsQuery.data?.boolTags || [];
    }, [tagsQuery.data]);

    const hasTagFilters = useMemo(() => {
        return (
            (tagsQuery.data?.boolTags && tagsQuery.data.boolTags.length > 0) || enumTags.length > 0
        );
    }, [tagsQuery.data, enumTags]);

    return (
        <>
            {hasTagFilters && <Divider my="md" />}
            {boolTags.length > 0 && (
                <MultiSelectWithInvalidData
                    clearable
                    data={boolTags}
                    defaultValue={query._custom?.[boolTags.join('|')] || []}
                    label={t('common.tags', { postProcess: 'sentenceCase' })}
                    onChange={handleTagsFilter}
                    searchable
                    width={250}
                />
            )}
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
