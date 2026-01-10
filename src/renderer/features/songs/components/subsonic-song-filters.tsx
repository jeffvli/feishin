import { ChangeEvent, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { SelectWithInvalidData } from '/@/renderer/components/select-with-invalid-data';
import { useListContext } from '/@/renderer/context/list-context';
import { useGenreList } from '/@/renderer/features/genres/api/genres-api';
import { useSongListFilters } from '/@/renderer/features/songs/hooks/use-song-list-filters';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { Text } from '/@/shared/components/text/text';

export const SubsonicSongFilters = () => {
    const { t } = useTranslation();
    const { query, setFavorite, setGenreId } = useSongListFilters();

    const { customFilters } = useListContext();

    const isGenrePage = customFilters?.genreIds !== undefined;

    const genreListQuery = useGenreList();

    const genreList = useMemo(() => {
        if (!genreListQuery.data) return [];
        return genreListQuery.data.items.map((genre) => ({
            label: genre.name,
            value: genre.id,
        }));
    }, [genreListQuery.data]);

    const handleGenresFilter = useCallback(
        (e: null | string) => {
            setGenreId(e ? [e] : null);
        },
        [setGenreId],
    );

    const toggleFilters = useMemo(
        () => [
            {
                label: t('filter.isFavorited', { postProcess: 'sentenceCase' }),
                onChange: (e: ChangeEvent<HTMLInputElement>) => {
                    const favoriteValue = e.target.checked ? true : undefined;
                    setFavorite(favoriteValue ?? null);
                },
                value: query.favorite,
            },
        ],
        [t, query.favorite, setFavorite],
    );

    return (
        <Stack px="md" py="md">
            {toggleFilters.map((filter) => (
                <Group justify="space-between" key={`ss-filter-${filter.label}`}>
                    <Text>{filter.label}</Text>
                    <Switch defaultChecked={filter.value ?? false} onChange={filter.onChange} />
                </Group>
            ))}
            {!isGenrePage && (
                <>
                    <Divider my="md" />
                    <SelectWithInvalidData
                        clearable
                        data={genreList}
                        defaultValue={query.genreIds ? query.genreIds[0] : undefined}
                        label={t('entity.genre', { count: 1, postProcess: 'titleCase' })}
                        onChange={handleGenresFilter}
                        searchable
                    />
                </>
            )}
        </Stack>
    );
};
