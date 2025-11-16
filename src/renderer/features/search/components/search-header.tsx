import debounce from 'lodash/debounce';
import { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link, useParams, useSearchParams } from 'react-router';

import {
    ALBUM_ARTIST_TABLE_COLUMNS,
    ALBUM_TABLE_COLUMNS,
    SONG_TABLE_COLUMNS,
} from '/@/renderer/components/item-list/item-table-list/default-columns';
import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { FilterBar } from '/@/renderer/features/shared/components/filter-bar';
import { LibraryHeaderBar } from '/@/renderer/features/shared/components/library-header-bar';
import { ListConfigMenu } from '/@/renderer/features/shared/components/list-config-menu';
import { SearchInput } from '/@/renderer/features/shared/components/search-input';
import { useContainerQuery } from '/@/renderer/hooks';
import { AppRoute } from '/@/renderer/router/routes';
import { Button, ButtonGroup } from '/@/shared/components/button/button';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { LibraryItem } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface SearchHeaderProps {
    navigationId: string;
}

export const SearchHeader = ({ navigationId }: SearchHeaderProps) => {
    const { t } = useTranslation();
    const { itemType } = useParams() as { itemType: LibraryItem };
    const [searchParams, setSearchParams] = useSearchParams();
    const { ref, ...cq } = useContainerQuery();

    const handleSearch = debounce((e: ChangeEvent<HTMLInputElement>) => {
        setSearchParams({ query: e.target.value }, { replace: true, state: { navigationId } });
    }, 200);

    const listConfigMenuProps = {
        [LibraryItem.ALBUM]: {
            listKey: ItemListKey.ALBUM,
            tableColumnsData: ALBUM_TABLE_COLUMNS,
        },
        [LibraryItem.ALBUM_ARTIST]: {
            listKey: ItemListKey.ALBUM_ARTIST,
            tableColumnsData: ALBUM_ARTIST_TABLE_COLUMNS,
        },
        [LibraryItem.SONG]: {
            listKey: ItemListKey.SONG,
            tableColumnsData: SONG_TABLE_COLUMNS,
        },
    };

    return (
        <Stack gap={0} ref={ref}>
            <PageHeader>
                <Flex justify="space-between" w="100%">
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
                <Flex justify="space-between" w="100%">
                    <ButtonGroup>
                        <Button
                            component={Link}
                            fw={600}
                            replace
                            size="compact-md"
                            state={{ navigationId }}
                            to={{
                                pathname: generatePath(AppRoute.SEARCH, {
                                    itemType: LibraryItem.SONG,
                                }),
                                search: searchParams.toString(),
                            }}
                            variant={itemType === LibraryItem.SONG ? 'filled' : 'default'}
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
                            variant={itemType === LibraryItem.ALBUM ? 'filled' : 'default'}
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
                            variant={itemType === LibraryItem.ALBUM_ARTIST ? 'filled' : 'default'}
                        >
                            {t('entity.artist_other', { postProcess: 'sentenceCase' })}
                        </Button>
                    </ButtonGroup>
                    <ListConfigMenu {...listConfigMenuProps[itemType]} />
                </Flex>
            </FilterBar>
        </Stack>
    );
};
