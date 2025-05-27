import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import debounce from 'lodash/debounce';
import { ChangeEvent, MutableRefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link, useParams, useSearchParams } from 'react-router-dom';

import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { FilterBar, LibraryHeaderBar } from '/@/renderer/features/shared';
import { SearchInput } from '/@/renderer/features/shared/components/search-input';
import { useContainerQuery } from '/@/renderer/hooks';
import { useListFilterRefresh } from '/@/renderer/hooks/use-list-filter-refresh';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, useListStoreByKey } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import {
    AlbumArtistListQuery,
    AlbumListQuery,
    LibraryItem,
    SongListQuery,
} from '/@/shared/types/domain-types';

interface SearchHeaderProps {
    navigationId: string;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const SearchHeader = ({ navigationId, tableRef }: SearchHeaderProps) => {
    const { t } = useTranslation();
    const { itemType } = useParams() as { itemType: LibraryItem };
    const [searchParams, setSearchParams] = useSearchParams();
    const cq = useContainerQuery();
    const server = useCurrentServer();
    const { filter } = useListStoreByKey<AlbumArtistListQuery | AlbumListQuery | SongListQuery>({
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
            gap={0}
            ref={cq.ref}
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
                            onChange={handleSearch}
                        />
                    </Group>
                </Flex>
            </PageHeader>
            <FilterBar>
                <Group>
                    <Button
                        component={Link}
                        fw={600}
                        replace
                        size="compact-md"
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
                        component={Link}
                        fw={600}
                        replace
                        size="compact-md"
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
                        component={Link}
                        fw={600}
                        replace
                        size="compact-md"
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
