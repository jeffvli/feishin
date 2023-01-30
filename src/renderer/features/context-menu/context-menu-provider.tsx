import { Divider, Group, Stack } from '@mantine/core';
import { useClickOutside, useResizeObserver, useSetState, useViewportSize } from '@mantine/hooks';
import { closeAllModals, openContextModal, openModal } from '@mantine/modals';
import { createContext, Fragment, useState } from 'react';
import { LibraryItem, ServerType } from '/@/renderer/api/types';
import { ConfirmModal, ContextMenu, ContextMenuButton, Text, toast } from '/@/renderer/components';
import {
  OpenContextMenuProps,
  useContextMenuEvents,
} from '/@/renderer/features/context-menu/events';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { useDeletePlaylist } from '/@/renderer/features/playlists';
import { useRemoveFromPlaylist } from '/@/renderer/features/playlists/mutations/remove-from-playlist-mutation';
import { useCreateFavorite, useDeleteFavorite } from '/@/renderer/features/shared';
import { useCurrentServer } from '/@/renderer/store';
import { Play } from '/@/renderer/types';

type ContextMenuContextProps = {
  closeContextMenu: () => void;
  openContextMenu: (args: OpenContextMenuProps) => void;
};

const ContextMenuContext = createContext<ContextMenuContextProps>({
  closeContextMenu: () => {},
  openContextMenu: (args: OpenContextMenuProps) => {
    return args;
  },
});

export interface ContextMenuProviderProps {
  children: React.ReactNode;
}

export const ContextMenuProvider = ({ children }: ContextMenuProviderProps) => {
  const [opened, setOpened] = useState(false);
  const clickOutsideRef = useClickOutside(() => setOpened(false));
  const viewport = useViewportSize();
  const server = useCurrentServer();
  const serverType = server?.type;
  const [ref, menuRect] = useResizeObserver();
  const [ctx, setCtx] = useSetState<OpenContextMenuProps>({
    data: [],
    dataNodes: [],
    menuItems: [],
    tableRef: undefined,
    type: LibraryItem.SONG,
    xPos: 0,
    yPos: 0,
  });

  const handlePlayQueueAdd = usePlayQueueAdd();

  const openContextMenu = (args: OpenContextMenuProps) => {
    const { xPos, yPos, menuItems, data, type, tableRef, dataNodes, context } = args;

    const shouldReverseY = yPos + menuRect.height > viewport.height;
    const shouldReverseX = xPos + menuRect.width > viewport.width;

    const calculatedXPos = shouldReverseX ? xPos - menuRect.width : xPos;
    const calculatedYPos = shouldReverseY ? yPos - menuRect.height : yPos;

    setCtx({
      context,
      data,
      dataNodes,
      menuItems,
      tableRef,
      type,
      xPos: calculatedXPos,
      yPos: calculatedYPos,
    });
    setOpened(true);
  };

  const closeContextMenu = () => {
    setOpened(false);
    setCtx({
      data: [],
      dataNodes: [],
      menuItems: [],
      tableRef: undefined,
      type: LibraryItem.SONG,
      xPos: 0,
      yPos: 0,
    });
  };

  useContextMenuEvents({
    closeContextMenu,
    openContextMenu,
  });

  const handlePlay = (play: Play) => {
    switch (ctx.type) {
      case LibraryItem.ALBUM:
        handlePlayQueueAdd?.({
          byItemType: { id: ctx.data.map((item) => item.id), type: ctx.type },
          play,
        });
        break;
      case LibraryItem.ARTIST:
        handlePlayQueueAdd?.({
          byItemType: { id: ctx.data.map((item) => item.id), type: ctx.type },
          play,
        });
        break;
      case LibraryItem.ALBUM_ARTIST:
        handlePlayQueueAdd?.({
          byItemType: { id: ctx.data.map((item) => item.id), type: ctx.type },
          play,
        });
        break;
      case LibraryItem.SONG:
        handlePlayQueueAdd?.({ byData: ctx.data, play });
        break;
      case LibraryItem.PLAYLIST:
        for (const item of ctx.data) {
          handlePlayQueueAdd?.({
            byItemType: { id: [item.id], type: ctx.type },
            play,
          });
        }

        break;
    }
  };

  const deletePlaylistMutation = useDeletePlaylist();

  const handleDeletePlaylist = () => {
    for (const item of ctx.data) {
      deletePlaylistMutation?.mutate(
        { query: { id: item.id } },
        {
          onError: (err) => {
            toast.error({
              message: err.message,
              title: 'Error deleting playlist',
            });
          },
          onSuccess: () => {
            toast.success({
              message: `${item.name} was successfully deleted`,
              title: 'Playlist deleted',
            });
          },
        },
      );
    }
    closeAllModals();
  };

  const openDeletePlaylistModal = () => {
    openModal({
      children: (
        <ConfirmModal onConfirm={handleDeletePlaylist}>
          <Stack>
            <Text>Are you sure you want to delete the following playlist(s)?</Text>
            <ul>
              {ctx.data.map((item) => (
                <li key={item.id}>
                  <Group>
                    —<Text $secondary>{item.name}</Text>
                  </Group>
                </li>
              ))}
            </ul>
          </Stack>
        </ConfirmModal>
      ),
      title: 'Delete playlist(s)',
    });
  };

  const createFavoriteMutation = useCreateFavorite();
  const deleteFavoriteMutation = useDeleteFavorite();
  const handleAddToFavorites = () => {
    if (!ctx.dataNodes) return;
    const nodesToFavorite = ctx.dataNodes.filter((item) => !item.data.userFavorite);
    createFavoriteMutation.mutate(
      {
        query: {
          id: nodesToFavorite.map((item) => item.data.id),
          type: ctx.type,
        },
      },
      {
        onError: (err) => {
          toast.error({
            message: err.message,
            title: 'Error adding to favorites',
          });
        },
        onSuccess: () => {
          for (const node of nodesToFavorite) {
            node.setData({ ...node.data, userFavorite: true });
          }
        },
      },
    );
  };

  const handleRemoveFromFavorites = () => {
    if (!ctx.dataNodes) return;
    const nodesToUnfavorite = ctx.dataNodes.filter((item) => item.data.userFavorite);

    deleteFavoriteMutation.mutate(
      {
        query: {
          id: nodesToUnfavorite.map((item) => item.data.id),
          type: ctx.type,
        },
      },
      {
        onSuccess: () => {
          for (const node of nodesToUnfavorite) {
            node.setData({ ...node.data, userFavorite: false });
          }
        },
      },
    );
  };

  const handleAddToPlaylist = () => {
    if (!ctx.dataNodes) return;
    openContextModal({
      innerProps: {
        albumId:
          ctx.type === LibraryItem.ALBUM ? ctx.dataNodes.map((node) => node.data.id) : undefined,
        artistId:
          ctx.type === LibraryItem.ARTIST ? ctx.dataNodes.map((node) => node.data.id) : undefined,
        songId:
          ctx.type === LibraryItem.SONG ? ctx.dataNodes.map((node) => node.data.id) : undefined,
      },
      modal: 'addToPlaylist',
      size: 'md',
      title: 'Add to playlist',
    });
  };

  const removeFromPlaylistMutation = useRemoveFromPlaylist();

  const handleRemoveFromPlaylist = () => {
    const songId =
      (serverType === ServerType.NAVIDROME || ServerType.JELLYFIN
        ? ctx.dataNodes?.map((node) => node.data.playlistItemId)
        : ctx.dataNodes?.map((node) => node.data.id)) || [];

    const confirm = () => {
      removeFromPlaylistMutation.mutate(
        {
          query: {
            id: ctx.context.playlistId,
            songId,
          },
        },
        {
          onError: (err) => {
            toast.error({
              message: err.message,
              title: 'Error removing song(s) from playlist',
            });
          },
          onSuccess: () => {
            toast.success({
              message: `${songId.length} song(s) were removed from the playlist`,
              title: 'Song(s) removed from playlist',
            });
            ctx.context?.tableRef?.current?.api?.refreshInfiniteCache();
            closeAllModals();
          },
        },
      );
    };

    openModal({
      children: (
        <ConfirmModal
          loading={removeFromPlaylistMutation.isLoading}
          onConfirm={confirm}
        >
          Are you sure you want to remove the following song(s) from the playlist?
        </ConfirmModal>
      ),
      title: 'Remove song(s) from playlist',
    });
  };

  const contextMenuItems = {
    addToFavorites: {
      id: 'addToFavorites',
      label: 'Add to favorites',
      onClick: handleAddToFavorites,
    },
    addToPlaylist: { id: 'addToPlaylist', label: 'Add to playlist', onClick: handleAddToPlaylist },
    createPlaylist: { id: 'createPlaylist', label: 'Create playlist', onClick: () => {} },
    deletePlaylist: {
      id: 'deletePlaylist',
      label: 'Delete playlist',
      onClick: openDeletePlaylistModal,
    },
    play: {
      id: 'play',
      label: 'Play',
      onClick: () => handlePlay(Play.NOW),
    },
    playLast: {
      id: 'playLast',
      label: 'Add to queue',
      onClick: () => handlePlay(Play.LAST),
    },
    playNext: {
      id: 'playNext',
      label: 'Add to queue next',
      onClick: () => handlePlay(Play.NEXT),
    },
    removeFromFavorites: {
      id: 'removeFromFavorites',
      label: 'Remove from favorites',
      onClick: handleRemoveFromFavorites,
    },
    removeFromPlaylist: {
      id: 'removeFromPlaylist',
      label: 'Remove from playlist',
      onClick: handleRemoveFromPlaylist,
    },
    setRating: { id: 'setRating', label: 'Set rating', onClick: () => {} },
  };

  return (
    <ContextMenuContext.Provider
      value={{
        closeContextMenu,
        openContextMenu,
      }}
    >
      {opened && (
        <ContextMenu
          ref={ref}
          minWidth={125}
          xPos={ctx.xPos}
          yPos={ctx.yPos}
        >
          <Stack
            ref={clickOutsideRef}
            spacing={0}
            onClick={closeContextMenu}
          >
            {ctx.menuItems?.map((item) => {
              return (
                <Fragment key={`context-menu-${item.id}`}>
                  <ContextMenuButton
                    as="button"
                    disabled={item.disabled}
                    onClick={contextMenuItems[item.id as keyof typeof contextMenuItems].onClick}
                  >
                    {contextMenuItems[item.id as keyof typeof contextMenuItems].label}
                  </ContextMenuButton>
                  {item.divider && (
                    <Divider
                      key={`context-menu-divider-${item.id}`}
                      color="rgb(62, 62, 62)"
                      size="sm"
                    />
                  )}
                </Fragment>
              );
            })}
          </Stack>
        </ContextMenu>
      )}

      {children}
    </ContextMenuContext.Provider>
  );
};
