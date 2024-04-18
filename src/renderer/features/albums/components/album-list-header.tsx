import { useEffect, useRef, type ChangeEvent, type MutableRefObject } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Flex, Group, Stack } from '@mantine/core';
import debounce from 'lodash/debounce';
import { useTranslation } from 'react-i18next';
import { LibraryItem } from '/@/renderer/api/types';
import { Button, PageHeader, SearchInput } from '/@/renderer/components';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { AlbumListHeaderFilters } from '/@/renderer/features/albums/components/album-list-header-filters';
import { FilterBar, LibraryHeaderBar } from '/@/renderer/features/shared';
import { useContainerQuery } from '/@/renderer/hooks';
import { AlbumListFilter, useCurrentServer, usePlayButtonBehavior } from '/@/renderer/store';
import { titleCase } from '/@/renderer/utils';
import { RiMusicLine } from 'react-icons/ri';
import { generatePath } from 'react-router';
import { Link } from 'react-router-dom';
import { AppRoute } from '/@/renderer/router/routes';
import { useDisplayRefresh } from '/@/renderer/hooks/use-display-refresh';

interface AlbumListHeaderProps {
    genreId?: string;
    gridRef: MutableRefObject<VirtualInfiniteGridRef | null>;
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
    title?: string;
}

export const AlbumListHeader = ({
    genreId,
    itemCount,
    gridRef,
    tableRef,
    title,
}: AlbumListHeaderProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const cq = useContainerQuery();
    const playButtonBehavior = usePlayButtonBehavior();
    const genreRef = useRef<string>();
    const { filter, handlePlay, refresh, search } = useDisplayRefresh({
        gridRef,
        itemType: LibraryItem.ALBUM,
        server,
        tableRef,
    });

    const handleSearch = debounce((e: ChangeEvent<HTMLInputElement>) => {
        const updatedFilters = search(e) as AlbumListFilter;

        refresh(updatedFilters);
    }, 500);

    useEffect(() => {
        if (genreRef.current && genreRef.current !== genreId) {
            refresh(filter);
        }

        genreRef.current = genreId;
    }, [filter, genreId, refresh, tableRef]);

    return (
        <Stack
            ref={cq.ref}
            spacing={0}
        >
            <PageHeader backgroundColor="var(--titlebar-bg)">
                <Flex
                    justify="space-between"
                    w="100%"
                >
                    <LibraryHeaderBar>
                        <LibraryHeaderBar.PlayButton
                            onClick={() => handlePlay?.({ playType: playButtonBehavior })}
                        />
                        <LibraryHeaderBar.Title>
                            {title ||
                                titleCase(t('page.albumList.title', { postProcess: 'titleCase' }))}
                        </LibraryHeaderBar.Title>
                        <LibraryHeaderBar.Badge
                            isLoading={itemCount === null || itemCount === undefined}
                        >
                            {itemCount}
                        </LibraryHeaderBar.Badge>
                        {genreId && (
                            <Button
                                compact
                                component={Link}
                                radius={0}
                                size="md"
                                to={generatePath(AppRoute.LIBRARY_GENRES_SONGS, {
                                    genreId,
                                })}
                                tooltip={{
                                    label: t('page.albumList.showTracks', {
                                        postProcess: 'sentenceCase',
                                    }),
                                }}
                                variant="filled"
                            >
                                <RiMusicLine />
                            </Button>
                        )}
                    </LibraryHeaderBar>
                    <Group>
                        <SearchInput
                            defaultValue={filter.searchTerm}
                            openedWidth={cq.isMd ? 250 : cq.isSm ? 200 : 150}
                            onChange={handleSearch}
                        />
                    </Group>
                </Flex>
            </PageHeader>
            <FilterBar>
                <AlbumListHeaderFilters
                    gridRef={gridRef}
                    tableRef={tableRef}
                />
            </FilterBar>
        </Stack>
    );
};
