import { Divider, Group, Stack } from '@mantine/core';
import { useClickOutside, useResizeObserver, useSetState, useViewportSize } from '@mantine/hooks';
import { closeAllModals, openModal } from '@mantine/modals';
import { createContext, Fragment, useState } from 'react';
import { LibraryItem } from '/@/renderer/api/types';
import { ConfirmModal, ContextMenu, ContextMenuButton, Text, toast } from '/@/renderer/components';
import {
  OpenContextMenuProps,
  useContextMenuEvents,
} from '/@/renderer/features/context-menu/events';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { useDeletePlaylist } from '/@/renderer/features/playlists';
import { useCreateFavorite, useDeleteFavorite } from '/@/renderer/features/shared';
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
    const { xPos, yPos, menuItems, data, type, tableRef, dataNodes } = args;

    const shouldReverseY = yPos + menuRect.height > viewport.height;
    const shouldReverseX = xPos + menuRect.width > viewport.width;

    const calculatedXPos = shouldReverseX ? xPos - menuRect.width : xPos;
    const calculatedYPos = shouldReverseY ? yPos - menuRect.height : yPos;

    setCtx({
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

  const contextMenuItems = {
    addToFavorites: {
      id: 'addToFavorites',
      label: 'Add to favorites',
      onClick: handleAddToFavorites,
    },
    addToPlaylist: { id: 'addToPlaylist', label: 'Add to playlist', onClick: () => {} },
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
                    disabled={item.disabled}
                    variant="default"
                    onClick={contextMenuItems[item.id as keyof typeof contextMenuItems].onClick}
                  >
                    {contextMenuItems[item.id as keyof typeof contextMenuItems].label}
                  </ContextMenuButton>
                  {item.divider && <Divider key={`context-menu-divider-${item.id}`} />}
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
