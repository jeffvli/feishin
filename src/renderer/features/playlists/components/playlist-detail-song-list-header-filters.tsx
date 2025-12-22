import { openContextModal } from '@mantine/modals';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import i18n from '/@/i18n/i18n';
import { PLAYLIST_SONG_TABLE_COLUMNS } from '/@/renderer/components/item-list/item-table-list/default-columns';
import { useListContext } from '/@/renderer/context/list-context';
import { ContextMenuController } from '/@/renderer/features/context-menu/context-menu-controller';
import { playlistsQueries } from '/@/renderer/features/playlists/api/playlists-api';
import { ListConfigMenu } from '/@/renderer/features/shared/components/list-config-menu';
import { ListRefreshButton } from '/@/renderer/features/shared/components/list-refresh-button';
import { ListSearchInput } from '/@/renderer/features/shared/components/list-search-input';
import { ListSortByDropdown } from '/@/renderer/features/shared/components/list-sort-by-dropdown';
import { ListSortOrderToggleButton } from '/@/renderer/features/shared/components/list-sort-order-toggle-button';
import { MoreButton } from '/@/renderer/features/shared/components/more-button';
import { useContainerQuery } from '/@/renderer/hooks';
import { useCurrentServerId } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Divider } from '/@/shared/components/divider/divider';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';
import { useLocalStorage } from '/@/shared/hooks/use-local-storage';
import { LibraryItem, SongListSort, SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey, ListDisplayType } from '/@/shared/types/types';

interface PlaylistDetailSongListHeaderFiltersProps {
    isSmartPlaylist?: boolean;
}

export const PlaylistDetailSongListHeaderFilters = ({
    isSmartPlaylist,
}: PlaylistDetailSongListHeaderFiltersProps) => {
    const { t } = useTranslation();
    const { mode, setMode } = useListContext();
    const { playlistId } = useParams() as { playlistId: string };
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

    const { ref: containerRef, ...breakpoints } = useContainerQuery();

    const isViewEditMode = !isSmartPlaylist && breakpoints.isSm;
    const isEditMode = mode === 'edit';

    const [collapsed, setCollapsed] = useLocalStorage<boolean>({
        defaultValue: false,
        key: 'playlist-header-collapsed',
    });

    return (
        <Flex justify="space-between" ref={containerRef}>
            <Group gap="sm" w="100%">
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
                {!collapsed && <ListSearchInput />}
                <ListRefreshButton disabled={isEditMode} listKey={ItemListKey.PLAYLIST_SONG} />
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
                <ListConfigMenu
                    displayTypes={[
                        {
                            hidden: true,
                            value: ListDisplayType.GRID,
                        },
                    ]}
                    listKey={ItemListKey.PLAYLIST_SONG}
                    tableColumnsData={PLAYLIST_SONG_TABLE_COLUMNS}
                />
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
