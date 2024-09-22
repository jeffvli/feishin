import { ChangeEvent, MutableRefObject } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Flex, Group, Stack } from '@mantine/core';
import debounce from 'lodash/debounce';
import { useTranslation } from 'react-i18next';
import { generatePath, Link, useParams, useSearchParams } from 'react-router-dom';
import { useCurrentServer } from '../../../store/auth.store';
import {
    AlbumArtistListQuery,
    AlbumListQuery,
    LibraryItem,
    SongListQuery,
} from '/@/renderer/api/types';
import { Button, PageHeader, SearchInput } from '/@/renderer/components';
import { FilterBar, LibraryHeaderBar } from '/@/renderer/features/shared';
import { useContainerQuery } from '/@/renderer/hooks';
import { useListFilterRefresh } from '/@/renderer/hooks/use-list-filter-refresh';
import { AppRoute } from '/@/renderer/router/routes';
import { useListStoreByKey } from '/@/renderer/store';

interface SearchHeaderProps {
    navigationId: string;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const SearchHeader = ({ tableRef, navigationId }: SearchHeaderProps) => {
    const { t } = useTranslation();
    const { itemType } = useParams() as { itemType: LibraryItem };
    const [searchParams, setSearchParams] = useSearchParams();
    const cq = useContainerQuery();
    const server = useCurrentServer();
    const { filter } = useListStoreByKey<AlbumListQuery | AlbumArtistListQuery | SongListQuery>({
        key: itemType,
    });

    const { handleRefreshTable } = useListFilterRefresh({
        itemType,
        server,
    });

    const handleSearch = debounce((e: ChangeEvent<HTMLInputElement>) => {
        setSearchParams({ query: e.target.value }, { replace: true, state: { navigationId } });
        handleRefreshTable(tableRef, { ...filter, searchTerm: e.target.value });
    }, 200);

    return (
        <Stack
            ref={cq.ref}
            spacing={0}
        >
            <PageHeader>
                <Flex
                    justify="space-between"
                    w="100%"
                >
                    <LibraryHeaderBar>
                        <LibraryHeaderBar.Title>Search</LibraryHeaderBar.Title>
                    </LibraryHeaderBar>
                    <Group>
                        <SearchInput
                            defaultValue={searchParams.get('query') || ''}
                            openedWidth={cq.isMd ? 250 : cq.isSm ? 200 : 150}
                            onChange={handleSearch}
                        />
                    </Group>
                </Flex>
            </PageHeader>
            <FilterBar>
                <Group>
                    <Button
                        compact
                        replace
                        component={Link}
                        fw={600}
                        size="md"
                        state={{ navigationId }}
                        to={{
                            pathname: generatePath(AppRoute.SEARCH, { itemType: LibraryItem.SONG }),
                            search: searchParams.toString(),
                        }}
                        variant={itemType === LibraryItem.SONG ? 'filled' : 'subtle'}
                    >
                        {t('entity.track_other', { postProcess: 'sentenceCase' })}
                    </Button>
                    <Button
                        compact
                        replace
                        component={Link}
                        fw={600}
                        size="md"
                        state={{ navigationId }}
                        to={{
                            pathname: generatePath(AppRoute.SEARCH, {
                                itemType: LibraryItem.ALBUM,
                            }),
                            search: searchParams.toString(),
                        }}
                        variant={itemType === LibraryItem.ALBUM ? 'filled' : 'subtle'}
                    >
                        {t('entity.album_other', { postProcess: 'sentenceCase' })}
                    </Button>
                    <Button
                        compact
                        replace
                        component={Link}
                        fw={600}
                        size="md"
                        state={{ navigationId }}
                        to={{
                            pathname: generatePath(AppRoute.SEARCH, {
                                itemType: LibraryItem.ALBUM_ARTIST,
                            }),
                            search: searchParams.toString(),
                        }}
                        variant={itemType === LibraryItem.ALBUM_ARTIST ? 'filled' : 'subtle'}
                    >
                        {t('entity.artist_other', { postProcess: 'sentenceCase' })}
                    </Button>
                </Group>
            </FilterBar>
        </Stack>
    );
};
