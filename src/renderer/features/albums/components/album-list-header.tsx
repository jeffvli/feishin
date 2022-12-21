import type { MouseEvent } from 'react';
import { useCallback } from 'react';
import { Group, Slider } from '@mantine/core';
import throttle from 'lodash/throttle';
import { RiArrowDownSLine } from 'react-icons/ri';
import { AlbumListSort, SortOrder } from '/@/renderer/api/types';
import { Button, DropdownMenu, PageHeader } from '/@/renderer/components';
import { useCurrentServer, useAppStoreActions, useAlbumRouteStore } from '/@/renderer/store';
import { CardDisplayType } from '/@/renderer/types';
import { useMusicFolders } from '/@/renderer/features/shared';

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
    { name: 'Song Count', value: AlbumListSort.SONG_COUNT },
    { name: 'Favorited', value: AlbumListSort.FAVORITED },
    { name: 'Year', value: AlbumListSort.YEAR },
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

  const musicFoldersQuery = useMusicFolders();

  const sortByLabel =
    (server?.type &&
      (FILTERS[server.type as keyof typeof FILTERS] as { name: string; value: string }[]).find(
        (f) => f.value === filters.sortBy,
      )?.name) ||
    'Unknown';

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

  const handleSetMusicFolder = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget?.value) return;
      setPage('albums', {
        list: {
          ...page.list,
          filter: {
            ...page.list.filter,
            musicFolderId: e.currentTarget.value,
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
                key={`filter-${filter.name}`}
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
      </Group>
    </PageHeader>
  );
};
