import type { MouseEvent } from 'react';
import { useCallback } from 'react';
import { Group } from '@mantine/core';
import { Button, Slider, PageHeader, DropdownMenu } from '/@/renderer/components';
import throttle from 'lodash/throttle';
import { RiArrowDownSLine } from 'react-icons/ri';
import { SongListSort, SortOrder } from '/@/renderer/api/types';
import { useCurrentServer, useAppStoreActions, useSongRouteStore } from '/@/renderer/store';
import { CardDisplayType } from '/@/renderer/types';

const FILTERS = {
  jellyfin: [
    { name: 'Album Artist', value: SongListSort.ALBUM_ARTIST },
    { name: 'Artist', value: SongListSort.ARTIST },
    { name: 'Duration', value: SongListSort.DURATION },
    { name: 'Name', value: SongListSort.NAME },
    { name: 'Name', value: SongListSort.PLAY_COUNT },
    { name: 'Random', value: SongListSort.RANDOM },
    { name: 'Recently Added', value: SongListSort.RECENTLY_ADDED },
    { name: 'Recently Played', value: SongListSort.RECENTLY_PLAYED },
    { name: 'Release Date', value: SongListSort.RELEASE_DATE },
  ],
  navidrome: [
    { name: 'Album Artist', value: SongListSort.ALBUM_ARTIST },
    { name: 'Artist', value: SongListSort.ARTIST },
    { name: 'BPM', value: SongListSort.BPM },
    { name: 'Channels', value: SongListSort.CHANNELS },
    { name: 'Comment', value: SongListSort.COMMENT },
    { name: 'Duration', value: SongListSort.DURATION },
    { name: 'Favorited', value: SongListSort.FAVORITED },
    { name: 'Genre', value: SongListSort.GENRE },
    { name: 'Name', value: SongListSort.NAME },
    { name: 'Play Count', value: SongListSort.PLAY_COUNT },
    { name: 'Rating', value: SongListSort.RATING },
    { name: 'Recently Added', value: SongListSort.RECENTLY_ADDED },
    { name: 'Recently Played', value: SongListSort.RECENTLY_PLAYED },
    { name: 'Year', value: SongListSort.YEAR },
  ],
};

const ORDER = [
  { name: 'Ascending', value: SortOrder.ASC },
  { name: 'Descending', value: SortOrder.DESC },
];

export const SongListHeader = () => {
  const server = useCurrentServer();
  const { setPage } = useAppStoreActions();
  const page = useSongRouteStore();
  const filters = page.list.filter;

  const sortByLabel =
    (server?.type &&
      (FILTERS[server.type as keyof typeof FILTERS] as { name: string; value: string }[]).find(
        (f) => f.value === filters.sortBy,
      )?.name) ||
    'Unknown';

  const sortOrderLabel = ORDER.find((s) => s.value === filters.sortOrder)?.name;

  const setSize = throttle(
    (e: number) =>
      setPage('songs', {
        ...page,
        list: { ...page.list, size: e },
      }),
    200,
  );

  const handleSetFilter = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget?.value) return;
      setPage('songs', {
        list: {
          ...page.list,
          filter: {
            ...page.list.filter,
            sortBy: e.currentTarget.value as SongListSort,
          },
        },
      });
    },
    [page.list, setPage],
  );

  const handleSetOrder = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget?.value) return;
      setPage('songs', {
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
        setPage('songs', {
          ...page,
          list: {
            ...page.list,
            display: CardDisplayType.CARD,
            type: 'grid',
          },
        });
      } else if (type === CardDisplayType.POSTER) {
        setPage('songs', {
          ...page,
          list: {
            ...page.list,
            display: CardDisplayType.POSTER,
            type: 'grid',
          },
        });
      } else {
        setPage('songs', {
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
              Tracks
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
