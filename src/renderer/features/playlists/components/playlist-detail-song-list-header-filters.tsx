import { openContextModal } from '@mantine/modals';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import i18n from '/@/i18n/i18n';
import {
    ALBUM_TABLE_COLUMNS,
    PLAYLIST_SONG_TABLE_COLUMNS,
    SONG_TABLE_COLUMNS,
} from '/@/renderer/components/item-list/item-table-list/default-columns';
import { useListContext } from '/@/renderer/context/list-context';
import { ContextMenuController } from '/@/renderer/features/context-menu/context-menu-controller';
import { playlistsQueries } from '/@/renderer/features/playlists/api/playlists-api';
import { ClientSideSongFilters } from '/@/renderer/features/playlists/components/client-side-song-filters';
import { usePlaylistSongListFilters } from '/@/renderer/features/playlists/hooks/use-playlist-song-list-filters';
import { FilterButton } from '/@/renderer/features/shared/components/filter-button';
import {
    ListConfigMenu,
    SONG_DISPLAY_TYPES,
} from '/@/renderer/features/shared/components/list-config-menu';
import { ListDisplayTypeToggleButton } from '/@/renderer/features/shared/components/list-display-type-toggle-button';
import { isFilterValueSet } from '/@/renderer/features/shared/components/list-filters';
import { ListRefreshButton } from '/@/renderer/features/shared/components/list-refresh-button';
import { ListSortByDropdown } from '/@/renderer/features/shared/components/list-sort-by-dropdown';
import { ListSortOrderToggleButton } from '/@/renderer/features/shared/components/list-sort-order-toggle-button';
import { MoreButton } from '/@/renderer/features/shared/components/more-button';
import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { useContainerQuery } from '/@/renderer/hooks';
import {
    PlaylistTarget,
    useCurrentServerId,
    usePlaylistTarget,
    useSettingsStoreActions,
} from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Divider } from '/@/shared/components/divider/divider';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Modal } from '/@/shared/components/modal/modal';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';
import { useDisclosure } from '/@/shared/hooks/use-disclosure';
import { useLocalStorage } from '/@/shared/hooks/use-local-storage';
import { LibraryItem, SongListSort, SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface PlaylistDetailSongListHeaderFiltersProps {
    isSmartPlaylist?: boolean;
}

const PlaylistSongListFiltersModal = () => {
    const { t } = useTranslation();
    const { isSidebarOpen, setIsSidebarOpen } = useListContext();
    const { clear, query } = usePlaylistSongListFilters();
    const [isOpen, handlers] = useDisclosure(false);

    const hasActiveFilters = useMemo(() => {
        return Boolean(
            isFilterValueSet(query[FILTER_KEYS.SONG.ALBUM_ARTIST_IDS]) ||
                isFilterValueSet(query[FILTER_KEYS.SONG.ARTIST_IDS]) ||
                query[FILTER_KEYS.SONG.FAVORITE] !== undefined ||
                isFilterValueSet(query[FILTER_KEYS.SONG.GENRE_ID]) ||
                query[FILTER_KEYS.SONG.HAS_RATING] !== undefined ||
                query[FILTER_KEYS.SONG.MAX_YEAR] !== undefined ||
                query[FILTER_KEYS.SONG.MIN_YEAR] !== undefined,
        );
    }, [query]);

    const handlePin = () => {
        setIsSidebarOpen?.(!isSidebarOpen);
    };

    const canPin = Boolean(setIsSidebarOpen);

    return (
        <>
            <FilterButton isActive={hasActiveFilters} onClick={handlers.toggle} />
            <Modal
                handlers={handlers}
                opened={isOpen}
                size="lg"
                styles={{
                    content: {
                        height: '100%',
                        maxHeight: '640px',
                        maxWidth: 'var(--theme-content-max-width)',
                        width: '100%',
                    },
                }}
                title={
                    <Group justify="space-between" style={{ paddingRight: '3rem', width: '100%' }}>
                        <Group>
                            {canPin && (
                                <ActionIcon
                                    icon={isSidebarOpen ? 'unpin' : 'pin'}
                                    onClick={handlePin}
                                    variant="subtle"
                                />
                            )}
                            {t('common.filters', { postProcess: 'sentenceCase' })}
                        </Group>
                        <Button onClick={clear} size="compact-sm" variant="subtle">
                            {t('common.reset', { postProcess: 'sentenceCase' })}
                        </Button>
                    </Group>
                }
            >
                <ClientSideSongFilters />
            </Modal>
        </>
    );
};

export const PlaylistDetailSongListHeaderFilters = ({
    isSmartPlaylist,
}: PlaylistDetailSongListHeaderFiltersProps) => {
    const { t } = useTranslation();
    const { listKey: listKeyFromContext, mode, setMode } = useListContext();
    const { playlistId } = useParams() as { playlistId: string };
    const playlistTarget = usePlaylistTarget();
    const { setPlaylistBehavior } = useSettingsStoreActions();
    const serverId = useCurrentServerId();

    const detailQuery = useQuery(playlistsQueries.detail({ query: { id: playlistId }, serverId }));

    const handleMore = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (!detailQuery.data) return;

        ContextMenuController.call({
            cmd: {
                items: [detailQuery.data],
                type: LibraryItem.PLAYLIST,
            },
            event,
        });
    };

    const listKey =
        listKeyFromContext ??
        (playlistTarget === PlaylistTarget.ALBUM
            ? ItemListKey.PLAYLIST_ALBUM
            : ItemListKey.PLAYLIST_SONG);
    const isAlbumMode = listKey === ItemListKey.PLAYLIST_ALBUM;
    const toggleChoice = isAlbumMode
        ? t('entity.album', { count: 2, postProcess: 'titleCase' })
        : t('entity.track', { count: 2, postProcess: 'titleCase' });

    const handleToggleDisplayMode = useCallback(() => {
        setPlaylistBehavior(
            playlistTarget === PlaylistTarget.ALBUM ? PlaylistTarget.TRACK : PlaylistTarget.ALBUM,
        );
    }, [playlistTarget, setPlaylistBehavior]);

    const { ref: containerRef, ...breakpoints } = useContainerQuery();

    const isViewEditMode = !isSmartPlaylist && (breakpoints.isSm || isAlbumMode);
    const isEditMode = mode === 'edit';

    const [collapsed, setCollapsed] = useLocalStorage<boolean>({
        defaultValue: false,
        key: 'playlist-header-collapsed',
    });

    return (
        <Flex justify="space-between" ref={containerRef}>
            <Group gap="sm" w="100%">
                <Button
                    leftSection={<Icon icon="arrowLeftRight" />}
                    onClick={handleToggleDisplayMode}
                    variant="subtle"
                >
                    {toggleChoice}
                </Button>
                <Divider orientation="vertical" />
                <ListSortByDropdown
                    defaultSortByValue={SongListSort.ID}
                    disabled={isEditMode}
                    itemType={LibraryItem.PLAYLIST_SONG}
                    listKey={ItemListKey.PLAYLIST_SONG}
                />
                <Divider orientation="vertical" />
                <ListSortOrderToggleButton
                    defaultSortOrder={SortOrder.ASC}
                    disabled={isEditMode}
                    listKey={ItemListKey.PLAYLIST_SONG}
                />
                <Divider orientation="vertical" />
                <PlaylistSongListFiltersModal />
                <ListRefreshButton disabled={isEditMode} listKey={listKey} />
                <MoreButton onClick={handleMore} />
            </Group>
            <Group gap="sm" wrap="nowrap">
                {isViewEditMode && <SaveAndReplaceButton mode={mode} />}
                {isViewEditMode && (
                    <Button
                        onClick={() => setMode?.(mode === 'edit' ? 'view' : 'edit')}
                        uppercase
                        variant="subtle"
                    >
                        {mode === 'edit'
                            ? t('common.view', { postProcess: 'titleCase' })
                            : t('common.edit', { postProcess: 'titleCase' })}
                    </Button>
                )}
                <Tooltip
                    label={t(`common.${collapsed ? 'expand' : 'collapse'}`, {
                        postProcess: 'titleCase',
                    })}
                >
                    <ActionIcon
                        icon={collapsed ? 'arrowDownS' : 'arrowUpS'}
                        iconProps={{ size: 'xl' }}
                        onClick={() => setCollapsed((prev) => !prev)}
                        variant="subtle"
                    />
                </Tooltip>
                <ListDisplayTypeToggleButton enableDetail={isAlbumMode} listKey={listKey} />
                {isAlbumMode ? (
                    <ListConfigMenu
                        detailConfig={{
                            optionsConfig: {
                                autoFitColumns: { hidden: true },
                            },
                            tableColumnsData: SONG_TABLE_COLUMNS,
                            tableKey: 'detail',
                        }}
                        listKey={listKey}
                        tableColumnsData={ALBUM_TABLE_COLUMNS}
                    />
                ) : (
                    <ListConfigMenu
                        displayTypes={SONG_DISPLAY_TYPES}
                        listKey={listKey}
                        tableColumnsData={PLAYLIST_SONG_TABLE_COLUMNS}
                    />
                )}
            </Group>
        </Flex>
    );
};

export const openSaveAndReplaceModal = (playlistId: string, listData: unknown[]) => {
    openContextModal({
        innerProps: { listData, playlistId },
        modalKey: 'saveAndReplace',
        size: 'sm',
        title: i18n.t('common.saveAndReplace', { postProcess: 'titleCase' }) as string,
    });
};

const SaveAndReplaceButton = ({ mode }: { mode: 'edit' | 'view' | undefined }) => {
    const { t } = useTranslation();
    const { playlistId } = useParams() as { playlistId: string };
    const { listData } = useListContext();

    const handleOpenModal = useCallback(() => {
        if (!playlistId || !listData) return;
        openSaveAndReplaceModal(playlistId, listData);
    }, [playlistId, listData]);

    if (mode === 'view') {
        return null;
    }

    return (
        <Button
            leftSection={<Icon color="error" icon="save" />}
            onClick={handleOpenModal}
            size="sm"
            variant="subtle"
        >
            {t('common.saveAndReplace', { postProcess: 'titleCase' })}
        </Button>
    );
};
// const GenreFilterSelection = () => {
//     const { t } = useTranslation();
//     const { playlistId } = useParams() as { playlistId: string };
//     const serverId = useCurrentServerId();

//     const { data } = useQuery(playlistsQueries.songList({ query: { id: playlistId }, serverId }));

//     const genres = useMemo(() => {
//         const uniqueGenres = new Map<string, string>();

//         data?.items.forEach((song) => {
//             song.genres.forEach((genre) => {
//                 if (genre.id) {
//                     uniqueGenres.set(genre.id, genre.name);
//                 }
//             });
//         });

//         return Array.from(uniqueGenres.entries()).map(([id, name]) => ({
//             label: name,
//             value: id,
//         }));
//     }, [data?.items]);

//     return (
//         <Stack p="md" style={{ background: 'var(--theme-colors-surface)', height: '12rem' }}>
//             <Text>{t('filter.genre', { postProcess: 'titleCase' })}</Text>
//             <ScrollArea>
//                 <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
//                     {genres.map((genre) => (
//                         <li key={genre.value}>{genre.label}</li>
//                     ))}
//                 </ul>
//             </ScrollArea>
//         </Stack>
//     );
// };

// const ArtistFilterSelection = () => {
//     const { t } = useTranslation();
//     const { playlistId } = useParams() as { playlistId: string };
//     const serverId = useCurrentServerId();

//     const { data } = useQuery(playlistsQueries.songList({ query: { id: playlistId }, serverId }));

//     const artists = useMemo(() => {
//         const uniqueArtists = new Map<string, string>();

//         data?.items.forEach((song) => {
//             song.artists.forEach((artist) => {
//                 if (artist.id) {
//                     uniqueArtists.set(artist.id, artist.name);
//                 }
//             });
//         });

//         return Array.from(uniqueArtists.entries()).map(([id, name]) => ({
//             label: name,
//             value: id,
//         }));
//     }, [data?.items]);

//     return (
//         <Stack style={{ height: '12rem' }}>
//             <Text>{t('filter.artist', { postProcess: 'titleCase' })}</Text>
//             <ScrollArea>
//                 <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
//                     {artists.map((artist) => (
//                         <li key={artist.value}>{artist.label}</li>
//                     ))}
//                 </ul>
//             </ScrollArea>
//         </Stack>
//     );
// };
