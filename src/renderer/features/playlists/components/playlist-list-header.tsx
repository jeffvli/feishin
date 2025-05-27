import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { closeAllModals, openModal } from '@mantine/modals';
import debounce from 'lodash/debounce';
import { ChangeEvent, MutableRefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { RiFileAddFill } from 'react-icons/ri';

import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { CreatePlaylistForm } from '/@/renderer/features/playlists/components/create-playlist-form';
import { PlaylistListHeaderFilters } from '/@/renderer/features/playlists/components/playlist-list-header-filters';
import { LibraryHeaderBar } from '/@/renderer/features/shared';
import { SearchInput } from '/@/renderer/features/shared/components/search-input';
import { useContainerQuery } from '/@/renderer/hooks';
import { useDisplayRefresh } from '/@/renderer/hooks/use-display-refresh';
import { PlaylistListFilter, useCurrentServer } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Paper } from '/@/shared/components/paper/paper';
import { SpinnerIcon } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { LibraryItem, PlaylistListQuery, ServerType } from '/@/shared/types/domain-types';

interface PlaylistListHeaderProps {
    gridRef: MutableRefObject<null | VirtualInfiniteGridRef>;
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const PlaylistListHeader = ({ gridRef, itemCount, tableRef }: PlaylistListHeaderProps) => {
    const { t } = useTranslation();
    const cq = useContainerQuery();
    const server = useCurrentServer();

    const handleCreatePlaylistModal = () => {
        openModal({
            children: <CreatePlaylistForm onCancel={() => closeAllModals()} />,
            onClose: () => {
                tableRef?.current?.api?.purgeInfiniteCache();
            },
            size: server?.type === ServerType?.NAVIDROME ? 'xl' : 'sm',
            title: t('form.createPlaylist.title', { postProcess: 'sentenceCase' }),
        });
    };

    const { filter, refresh, search } = useDisplayRefresh<PlaylistListQuery>({
        gridRef,
        itemCount,
        itemType: LibraryItem.PLAYLIST,
        server,
        tableRef,
    });

    const handleSearch = debounce((e: ChangeEvent<HTMLInputElement>) => {
        const updatedFilters = search(e) as PlaylistListFilter;
        refresh(updatedFilters);
    }, 500);

    return (
        <Stack
            gap={0}
            ref={cq.ref}
        >
            <PageHeader>
                <Flex
                    align="center"
                    justify="space-between"
                    w="100%"
                >
                    <LibraryHeaderBar>
                        <LibraryHeaderBar.Title>
                            {t('page.playlistList.title', { postProcess: 'titleCase' })}
                        </LibraryHeaderBar.Title>
                        <Paper
                            fw="600"
                            px="1rem"
                            py="0.3rem"
                            radius="sm"
                        >
                            {itemCount === null || itemCount === undefined ? (
                                <SpinnerIcon />
                            ) : (
                                itemCount
                            )}
                        </Paper>
                        <Button
                            onClick={handleCreatePlaylistModal}
                            tooltip={{
                                label: t('action.createPlaylist', { postProcess: 'sentenceCase' }),
                                openDelay: 500,
                            }}
                            variant="filled"
                        >
                            <RiFileAddFill />
                        </Button>
                    </LibraryHeaderBar>
                    <Group>
                        <SearchInput
                            defaultValue={filter.searchTerm}
                            onChange={handleSearch}
                        />
                    </Group>
                </Flex>
            </PageHeader>
            <Paper p="1rem">
                <PlaylistListHeaderFilters
                    gridRef={gridRef}
                    tableRef={tableRef}
                />
            </Paper>
        </Stack>
    );
};
