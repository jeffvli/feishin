import type { MouseEvent, ChangeEvent } from 'react';
import { useCallback } from 'react';
import { Flex, Slider } from '@mantine/core';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import {
  RiArrowDownSLine,
  RiFilter3Line,
  RiFolder2Line,
  RiSortAsc,
  RiSortDesc,
} from 'react-icons/ri';
import { AlbumListSort, ServerType, SortOrder } from '/@/renderer/api/types';
import {
  Button,
  DropdownMenu,
  PageHeader,
  Popover,
  SearchInput,
  TextTitle,
} from '/@/renderer/components';
import {
  useCurrentServer,
  useAlbumListStore,
  useSetAlbumFilters,
  useSetAlbumStore,
} from '/@/renderer/store';
import { CardDisplayType } from '/@/renderer/types';
import { useMusicFolders } from '/@/renderer/features/shared';
import styled from 'styled-components';
import { NavidromeAlbumFilters } from '/@/renderer/features/albums/components/navidrome-album-filters';
import { JellyfinAlbumFilters } from '/@/renderer/features/albums/components/jellyfin-album-filters';

const FILTERS = {
  jellyfin: [
    { name: 'Album Artist', value: AlbumListSort.ALBUM_ARTIST },
    { name: 'Community Rating', value: AlbumListSort.COMMUNITY_RATING },
    { name: 'Critic Rating', value: AlbumListSort.CRITIC_RATING },
    { name: 'Name', value: AlbumListSort.NAME },
    { name: 'Random', value: AlbumListSort.RANDOM },
    { name: 'Recently Added', value: AlbumListSort.RECENTLY_ADDED },
    { name: 'Release Date', value: AlbumListSort.RELEASE_DATE },
  ],
  navidrome: [
    { name: 'Album Artist', value: AlbumListSort.ALBUM_ARTIST },
    { name: 'Artist', value: AlbumListSort.ARTIST },
    { name: 'Duration', value: AlbumListSort.DURATION },
    { name: 'Name', value: AlbumListSort.NAME },
    { name: 'Play Count', value: AlbumListSort.PLAY_COUNT },
    { name: 'Random', value: AlbumListSort.RANDOM },
    { name: 'Rating', value: AlbumListSort.RATING },
    { name: 'Recently Added', value: AlbumListSort.RECENTLY_ADDED },
    { name: 'Recently Played', value: AlbumListSort.RECENTLY_PLAYED },
    { name: 'Song Count', value: AlbumListSort.SONG_COUNT },
    { name: 'Favorited', value: AlbumListSort.FAVORITED },
    { name: 'Year', value: AlbumListSort.YEAR },
  ],
};

const ORDER = [
  { name: 'Ascending', value: SortOrder.ASC },
  { name: 'Descending', value: SortOrder.DESC },
];

const HeaderItems = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

export const AlbumListHeader = () => {
  const server = useCurrentServer();
  const setPage = useSetAlbumStore();
  const setFilter = useSetAlbumFilters();
  const page = useAlbumListStore();
  const filters = page.filter;

  const musicFoldersQuery = useMusicFolders();

  const sortByLabel =
    (server?.type &&
      (FILTERS[server.type as keyof typeof FILTERS] as { name: string; value: string }[]).find(
        (f) => f.value === filters.sortBy,
      )?.name) ||
    'Unknown';

  const setSize = throttle(
    (e: number) =>
      setPage({
        list: { ...page, grid: { ...page.grid, size: e } },
      }),
    200,
  );

  const handleSetSortBy = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget?.value) return;
      setFilter({
        sortBy: e.currentTarget.value as AlbumListSort,
      });
    },
    [setFilter],
  );

  const handleSetMusicFolder = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget?.value) return;
      setFilter({
        musicFolderId: e.currentTarget.value,
      });
    },
    [setFilter],
  );

  const handleSetOrder = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget?.value) return;
      setFilter({
        sortOrder: e.currentTarget.value as SortOrder,
      });
    },
    [setFilter],
  );

  const handleSetViewType = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget?.value) return;
      const type = e.currentTarget.value;
      if (type === CardDisplayType.CARD) {
        setPage({
          list: {
            ...page,
            display: CardDisplayType.CARD,
          },
        });
      } else if (type === CardDisplayType.POSTER) {
        setPage({
          list: {
            ...page,
            display: CardDisplayType.POSTER,
          },
        });
      } else {
        setPage({
          list: {
            ...page,
            display: CardDisplayType.TABLE,
          },
        });
      }
    },
    [page, setPage],
  );

  const handleSearch = debounce((e: ChangeEvent<HTMLInputElement>) => {
    setFilter({
      searchTerm: e.target.value,
    });
  }, 500);

  return (
    <PageHeader>
      <HeaderItems>
        <Flex
          align="center"
          gap="md"
          justify="center"
        >
          <DropdownMenu position="bottom">
            <DropdownMenu.Target>
              <Button
                compact
                pl={0}
                pr="0.5rem"
                rightIcon={<RiArrowDownSLine size={15} />}
                size="xl"
                variant="subtle"
              >
                <TextTitle
                  fw="bold"
                  order={2}
                >
                  Albums
                </TextTitle>
              </Button>
            </DropdownMenu.Target>
            <DropdownMenu.Dropdown>
              <DropdownMenu.Item>
                <Slider
                  defaultValue={page.grid.size || 0}
                  label={null}
                  onChange={setSize}
                />
              </DropdownMenu.Item>
              <DropdownMenu.Divider />
              <DropdownMenu.Item
                $isActive={page.display === CardDisplayType.CARD}
                value={CardDisplayType.CARD}
                onClick={handleSetViewType}
              >
                Card
              </DropdownMenu.Item>
              <DropdownMenu.Item
                $isActive={page.display === CardDisplayType.POSTER}
                value={CardDisplayType.POSTER}
                onClick={handleSetViewType}
              >
                Poster
              </DropdownMenu.Item>
              <DropdownMenu.Item
                disabled
                $isActive={page.display === CardDisplayType.TABLE}
                value="list"
                onClick={handleSetViewType}
              >
                List
              </DropdownMenu.Item>
            </DropdownMenu.Dropdown>
          </DropdownMenu>
          <DropdownMenu position="bottom">
            <DropdownMenu.Target>
              <Button
                compact
                fw="normal"
                variant="subtle"
              >
                {sortByLabel}
              </Button>
            </DropdownMenu.Target>
            <DropdownMenu.Dropdown>
              {FILTERS[server?.type as keyof typeof FILTERS].map((filter) => (
                <DropdownMenu.Item
                  key={`filter-${filter.name}`}
                  $isActive={filter.value === filters.sortBy}
                  value={filter.value}
                  onClick={handleSetSortBy}
                >
                  {filter.name}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Dropdown>
          </DropdownMenu>
          <DropdownMenu position="bottom">
            <DropdownMenu.Target>
              <Button
                compact
                fw="normal"
                variant="subtle"
              >
                {filters.sortOrder === SortOrder.ASC ? (
                  <RiSortAsc size={15} />
                ) : (
                  <RiSortDesc size={15} />
                )}
              </Button>
            </DropdownMenu.Target>
            <DropdownMenu.Dropdown>
              {ORDER.map((sort) => (
                <DropdownMenu.Item
                  key={`sort-${sort.value}`}
                  $isActive={sort.value === filters.sortOrder}
                  value={sort.value}
                  onClick={handleSetOrder}
                >
                  {sort.name}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Dropdown>
          </DropdownMenu>
          {server?.type === ServerType.JELLYFIN && (
            <DropdownMenu position="bottom">
              <DropdownMenu.Target>
                <Button
                  compact
                  fw="normal"
                  variant="subtle"
                >
                  <RiFolder2Line size={15} />
                </Button>
              </DropdownMenu.Target>
              <DropdownMenu.Dropdown>
                {musicFoldersQuery.data?.map((folder) => (
                  <DropdownMenu.Item
                    key={`musicFolder-${folder.id}`}
                    $isActive={filters.musicFolderId === folder.id}
                    value={folder.id}
                    onClick={handleSetMusicFolder}
                  >
                    {folder.name}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Dropdown>
            </DropdownMenu>
          )}
          <Popover>
            <Popover.Target>
              <Button
                compact
                fw="normal"
                variant="subtle"
              >
                <RiFilter3Line size={15} />
              </Button>
            </Popover.Target>
            <Popover.Dropdown>
              {server?.type === ServerType.NAVIDROME ? (
                <NavidromeAlbumFilters />
              ) : (
                <JellyfinAlbumFilters />
              )}
            </Popover.Dropdown>
          </Popover>
        </Flex>
        <Flex>
          <SearchInput
            defaultValue={page.filter.searchTerm}
            onChange={handleSearch}
          />
        </Flex>
      </HeaderItems>
    </PageHeader>
  );
};
