import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { SONG_TABLE_COLUMNS } from '/@/renderer/components/item-list/item-table-list/default-columns';
import { useListContext } from '/@/renderer/context/list-context';
import { useAlbumListFilters } from '/@/renderer/features/albums/hooks/use-album-list-filters';
import {
    ListConfigMenu,
    SONG_DISPLAY_TYPES,
} from '/@/renderer/features/shared/components/list-config-menu';
import { ListDisplayTypeToggleButton } from '/@/renderer/features/shared/components/list-display-type-toggle-button';
import {
    isFilterValueSet,
    ListFiltersModal,
} from '/@/renderer/features/shared/components/list-filters';
import { ListRefreshButton } from '/@/renderer/features/shared/components/list-refresh-button';
import { ListSortByDropdown } from '/@/renderer/features/shared/components/list-sort-by-dropdown';
import { ListSortOrderToggleButton } from '/@/renderer/features/shared/components/list-sort-order-toggle-button';
import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { useSongListFilters } from '/@/renderer/features/songs/hooks/use-song-list-filters';
import { GenreTarget, useGenreTarget, useSettingsStoreActions } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Divider } from '/@/shared/components/divider/divider';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { LibraryItem, SongListSort, SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export const SongListHeaderFilters = ({ toggleGenreTarget }: { toggleGenreTarget?: boolean }) => {
    const { t } = useTranslation();
    const target = useGenreTarget();
    const { setGenreBehavior } = useSettingsStoreActions();
    const albumFilters = useAlbumListFilters();
    const songFilters = useSongListFilters();

    const { pageKey } = useListContext();

    const handleToggleGenreTarget = useCallback(() => {
        // Clear all filter query states
        albumFilters.clear();
        songFilters.clear();

        // Toggle the genre target
        setGenreBehavior(target === GenreTarget.ALBUM ? GenreTarget.TRACK : GenreTarget.ALBUM);
    }, [target, setGenreBehavior, albumFilters, songFilters]);

    const choice = useMemo(() => {
        return target === GenreTarget.ALBUM
            ? t('entity.album', { count: 2, postProcess: 'titleCase' })
            : t('entity.track', { count: 2, postProcess: 'titleCase' });
    }, [target, t]);

    const hasActiveFilters = useMemo(() => {
        const query = songFilters.query;
        return Boolean(
            isFilterValueSet(query[FILTER_KEYS.SONG._CUSTOM]) ||
                isFilterValueSet(query[FILTER_KEYS.SONG.ARTIST_IDS]) ||
                query[FILTER_KEYS.SONG.FAVORITE] !== undefined ||
                isFilterValueSet(query[FILTER_KEYS.SONG.GENRE_ID]) ||
                isFilterValueSet(query[FILTER_KEYS.SONG.MAX_YEAR]) ||
                isFilterValueSet(query[FILTER_KEYS.SONG.MIN_YEAR]) ||
                isFilterValueSet(query[FILTER_KEYS.SHARED.SEARCH_TERM]),
        );
    }, [songFilters.query]);

    return (
        <Flex justify="space-between">
            <Group gap="sm" w="100%">
                {toggleGenreTarget && (
                    <>
                        <Button
                            leftSection={<Icon icon="arrowLeftRight" />}
                            onClick={handleToggleGenreTarget}
                            variant="subtle"
                        >
                            {choice}
                        </Button>
                        <Divider orientation="vertical" />
                    </>
                )}
                <ListSortByDropdown
                    defaultSortByValue={SongListSort.NAME}
                    itemType={LibraryItem.SONG}
                    listKey={pageKey as ItemListKey}
                />
                <Divider orientation="vertical" />
                <ListSortOrderToggleButton
                    defaultSortOrder={SortOrder.ASC}
                    listKey={pageKey as ItemListKey}
                />
                <ListFiltersModal isActive={hasActiveFilters} itemType={LibraryItem.SONG} />
                <ListRefreshButton listKey={pageKey as ItemListKey} />
            </Group>
            <Group gap="sm" wrap="nowrap">
                <ListDisplayTypeToggleButton listKey={ItemListKey.SONG} />
                <ListConfigMenu
                    displayTypes={SONG_DISPLAY_TYPES}
                    listKey={ItemListKey.SONG}
                    tableColumnsData={SONG_TABLE_COLUMNS}
                />
            </Group>
        </Flex>
    );
};
