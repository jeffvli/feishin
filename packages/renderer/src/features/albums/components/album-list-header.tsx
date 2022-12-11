import type { MouseEvent } from 'react';
import { useCallback } from 'react';
import { Group, Slider } from '@mantine/core';
import throttle from 'lodash/throttle';
import { RiArrowDownSLine } from 'react-icons/ri';
import { JFAlbumListSort } from '/@/api/jellyfin.types';
import { NDAlbumListSort } from '/@/api/navidrome.types';
import type { AlbumListSort } from '/@/api/types';
import { SortOrder } from '/@/api/types';
import { Button, DropdownMenu, PageHeader } from '/@/components';
import { useCurrentServer, useAppStoreActions, useAlbumRouteStore } from '/@/store';
import { CardDisplayType } from '/@/types';

const FILTERS = {
  jellyfin: [
    { name: 'Album Artist', value: JFAlbumListSort.NAME },
    { name: 'Community Rating', value: JFAlbumListSort.RATING },
    { name: 'Critic Rating', value: JFAlbumListSort.CRITIC_RATING },
    { name: 'Name', value: JFAlbumListSort.NAME },
    { name: 'Random', value: JFAlbumListSort.RANDOM },
    { name: 'Recently Added', value: JFAlbumListSort.RECENTLY_ADDED },
    { name: 'Release Date', value: JFAlbumListSort.RELEASE_DATE },
  ],
  navidrome: [
    { name: 'Album Artist', value: NDAlbumListSort.ALBUM_ARTIST },
    { name: 'Artist', value: NDAlbumListSort.ARTIST },
    { name: 'Duration', value: NDAlbumListSort.DURATION },
    { name: 'Name', value: NDAlbumListSort.NAME },
    { name: 'Play Count', value: NDAlbumListSort.PLAY_COUNT },
    { name: 'Random', value: NDAlbumListSort.RANDOM },
    { name: 'Rating', value: NDAlbumListSort.RATING },
    { name: 'Recently Added', value: NDAlbumListSort.RECENTLY_ADDED },
    { name: 'Song Count', value: NDAlbumListSort.SONG_COUNT },
    { name: 'Starred', value: NDAlbumListSort.STARRED },
    { name: 'Year', value: NDAlbumListSort.YEAR },
  ],
};

const ORDER = [
  { name: 'Ascending', value: SortOrder.ASC },
  { name: 'Descending', value: SortOrder.DESC },
];

export const AlbumListHeader = () => {
  const server = useCurrentServer();
  const { setPage } = useAppStoreActions();
  const page = useAlbumRouteStore();
  const filters = page.list.filter;

  const sortByLabel = server?.type
    ? (FILTERS[server.type as keyof typeof FILTERS] as { name: string; value: string }[]).find(
        (f) => f.value === filters.sortBy,
      )?.name
    : 'Unknown';

  const sortOrderLabel = ORDER.find((s) => s.value === filters.sortOrder)?.name;

  const setSize = throttle(
    (e: number) =>
      setPage('albums', {
        ...page,
        list: { ...page.list, size: e },
      }),
    200,
  );

  const handleSetFilter = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget?.value) return;
      setPage('albums', {
        list: {
          ...page.list,
          filter: {
            ...page.list.filter,
            sortBy: e.currentTarget.value as AlbumListSort,
          },
        },
      });
    },
    [page.list, setPage],
  );

  const handleSetOrder = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget?.value) return;
      setPage('albums', {
        list: {
          ...page.list,
          filter: {
            ...page.list.filter,
            sortOrder: e.currentTarget.value as SortOrder,
          },
        },
      });
    },
    [page.list, setPage],
  );

  const handleSetViewType = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget?.value) return;
      const type = e.currentTarget.value;
      if (type === CardDisplayType.CARD) {
        setPage('albums', {
          ...page,
          list: {
            ...page.list,
            display: CardDisplayType.CARD,
            type: 'grid',
          },
        });
      } else if (type === CardDisplayType.POSTER) {
        setPage('albums', {
          ...page,
          list: {
            ...page.list,
            display: CardDisplayType.POSTER,
            type: 'grid',
          },
        });
      } else {
        setPage('albums', {
          ...page,
          list: {
            ...page.list,
            type: 'list',
          },
        });
      }
    },
    [page, setPage],
  );

  return (
    <PageHeader>
      <Group>
        <DropdownMenu
          position="bottom-end"
          width={100}
        >
          <DropdownMenu.Target>
            <Button
              compact
              rightIcon={<RiArrowDownSLine size={15} />}
              size="xl"
              sx={{ paddingLeft: 0, paddingRight: 0 }}
              variant="subtle"
            >
              Albums
            </Button>
          </DropdownMenu.Target>
          <DropdownMenu.Dropdown>
            <DropdownMenu.Item>
              <Slider
                defaultValue={page.list?.size || 0}
                label={null}
                onChange={setSize}
              />
            </DropdownMenu.Item>
            <DropdownMenu.Divider />
            <DropdownMenu.Item
              $isActive={page.list.type === 'grid' && page.list.display === CardDisplayType.CARD}
              value={CardDisplayType.CARD}
              onClick={handleSetViewType}
            >
              Card
            </DropdownMenu.Item>
            <DropdownMenu.Item
              $isActive={page.list.type === 'grid' && page.list.display === CardDisplayType.POSTER}
              value={CardDisplayType.POSTER}
              onClick={handleSetViewType}
            >
              Poster
            </DropdownMenu.Item>
            <DropdownMenu.Item
              disabled
              $isActive={page.list.type === 'list'}
              value="list"
              onClick={handleSetViewType}
            >
              List
            </DropdownMenu.Item>
          </DropdownMenu.Dropdown>
        </DropdownMenu>
        <DropdownMenu position="bottom-start">
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
                key={`filter-${filter.value}`}
                $isActive={filter.value === filters.sortBy}
                value={filter.value}
                onClick={handleSetFilter}
              >
                {filter.name}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Dropdown>
        </DropdownMenu>
        <DropdownMenu position="bottom-start">
          <DropdownMenu.Target>
            <Button
              compact
              fw="normal"
              variant="subtle"
            >
              {sortOrderLabel}
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
        <DropdownMenu position="bottom-start">
          <DropdownMenu.Target>
            <Button
              compact
              fw="normal"
              variant="subtle"
            >
              Folder
            </Button>
          </DropdownMenu.Target>
          {/* <DropdownMenu.Dropdown>
          {serverFolders?.map((folder) => (
            <DropdownMenu.Item
              key={folder.id}
              $isActive={filters.serverFolderId.includes(folder.id)}
              closeMenuOnClick={false}
              value={folder.id}
              onClick={handleSetServerFolder}
            >
              {folder.name}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Dropdown> */}
        </DropdownMenu>
      </Group>
    </PageHeader>
  );
};
