import { RowNode } from '@ag-grid-community/core';
import { Divider, Group, Portal, Stack } from '@mantine/core';
import {
  useClickOutside,
  useMergedRef,
  useResizeObserver,
  useSetState,
  useViewportSize,
} from '@mantine/hooks';
import { closeAllModals, openContextModal, openModal } from '@mantine/modals';
import { AnimatePresence } from 'framer-motion';
import { createContext, Fragment, ReactNode, useState, useMemo, useCallback } from 'react';
import {
  RiAddBoxFill,
  RiAddCircleFill,
  RiArrowRightSFill,
  RiDeleteBinFill,
  RiDislikeFill,
  RiHeartFill,
  RiPlayFill,
  RiPlayListAddFill,
  RiStarFill,
} from 'react-icons/ri';
import { AnyLibraryItems, LibraryItem, ServerType } from '/@/renderer/api/types';
import {
  ConfirmModal,
  ContextMenu,
  ContextMenuButton,
  HoverCard,
  Rating,
  Text,
  toast,
} from '/@/renderer/components';
import {
  ContextMenuItemType,
  OpenContextMenuProps,
  useContextMenuEvents,
} from '/@/renderer/features/context-menu/events';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { useDeletePlaylist } from '/@/renderer/features/playlists';
import { useRemoveFromPlaylist } from '/@/renderer/features/playlists/mutations/remove-from-playlist-mutation';
import { useCreateFavorite, useDeleteFavorite, useUpdateRating } from '/@/renderer/features/shared';
import { useAuthStore, useCurrentServer } from '/@/renderer/store';
import { Play } from '/@/renderer/types';

type ContextMenuContextProps = {
  closeContextMenu: () => void;
  openContextMenu: (args: OpenContextMenuProps) => void;
};

type ContextMenuItem = {
  children?: ContextMenuItem[];
  disabled?: boolean;
  id: string;
  label: string | ReactNode;
  leftIcon?: ReactNode;
  onClick?: (...args: any) => any;
  rightIcon?: ReactNode;
};

const ContextMenuContext = createContext<ContextMenuContextProps>({
  closeContextMenu: () => {},
  openContextMenu: (args: OpenContextMenuProps) => {
    return args;
  },
});

const JELLYFIN_IGNORED_MENU_ITEMS: ContextMenuItemType[] = ['setRating'];
// const NAVIDROME_IGNORED_MENU_ITEMS: ContextMenuItemType[] = [];
// const SUBSONIC_IGNORED_MENU_ITEMS: ContextMenuItemType[] = [];

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

    const serverType = data[0]?.serverType || useAuthStore.getState().currentServer?.type;
    let validMenuItems = menuItems;

    if (serverType === ServerType.JELLYFIN) {
      validMenuItems = menuItems.filter((item) => !JELLYFIN_IGNORED_MENU_ITEMS.includes(item.id));
    }

    // If the context menu dimension can't be automatically calculated, calculate it manually
    // This is a hacky way since resize observer may not automatically recalculate when not rendered
    const menuHeight = menuRect.height || (menuItems.length + 1) * 50;
    const menuWidth = menuRect.width || 220;

    const shouldReverseY = yPos + menuHeight > viewport.height;
    const shouldReverseX = xPos + menuWidth > viewport.width;

    const calculatedXPos = shouldReverseX ? xPos - menuWidth : xPos;
    const calculatedYPos = shouldReverseY ? yPos - menuHeight : yPos;

    setCtx({
      context,
      data,
      dataNodes,
      menuItems: validMenuItems,
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

  const handlePlay = useCallback(
    (play: Play) => {
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
    },
    [ctx.data, ctx.type, handlePlayQueueAdd],
  );

  const deletePlaylistMutation = useDeletePlaylist();

  const handleDeletePlaylist = useCallback(() => {
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
  }, [ctx.data, deletePlaylistMutation]);

  const openDeletePlaylistModal = useCallback(() => {
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
  }, [ctx.data, handleDeletePlaylist]);

  const createFavoriteMutation = useCreateFavorite();
  const deleteFavoriteMutation = useDeleteFavorite();
  const handleAddToFavorites = useCallback(() => {
    if (!ctx.dataNodes && !ctx.data) return;

    let itemsToFavorite: AnyLibraryItems = [];
    let nodesToFavorite: RowNode<any>[] = [];

    if (ctx.dataNodes) {
      nodesToFavorite = ctx.dataNodes.filter((item) => !item.data.userFavorite);
    } else {
      itemsToFavorite = ctx.data.filter((item) => !item.userFavorite);
    }

    const idsToFavorite = nodesToFavorite
      ? nodesToFavorite.map((node) => node.data.id)
      : itemsToFavorite.map((item) => item.id);

    createFavoriteMutation.mutate(
      {
        query: {
          id: idsToFavorite,
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
          if (ctx.dataNodes) {
            for (const node of nodesToFavorite) {
              node.setData({ ...node.data, userFavorite: true });
            }
          }
        },
      },
    );
  }, [createFavoriteMutation, ctx.data, ctx.dataNodes, ctx.type]);

  const handleRemoveFromFavorites = useCallback(() => {
    if (!ctx.dataNodes && !ctx.data) return;

    let itemsToUnfavorite: AnyLibraryItems = [];
    let nodesToUnfavorite: RowNode<any>[] = [];

    if (ctx.dataNodes) {
      nodesToUnfavorite = ctx.dataNodes.filter((item) => !item.data.userFavorite);
    } else {
      itemsToUnfavorite = ctx.data.filter((item) => !item.userFavorite);
    }

    const idsToUnfavorite = nodesToUnfavorite
      ? nodesToUnfavorite.map((node) => node.data.id)
      : itemsToUnfavorite.map((item) => item.id);

    deleteFavoriteMutation.mutate(
      {
        query: {
          id: idsToUnfavorite,
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
  }, [ctx.data, ctx.dataNodes, ctx.type, deleteFavoriteMutation]);

  const handleAddToPlaylist = useCallback(() => {
    if (!ctx.dataNodes && !ctx.data) return;

    const albumId: string[] = [];
    const artistId: string[] = [];
    const songId: string[] = [];

    if (ctx.dataNodes) {
      for (const node of ctx.dataNodes) {
        switch (node.data.type) {
          case LibraryItem.ALBUM:
            albumId.push(node.data.id);
            break;
          case LibraryItem.ARTIST:
            artistId.push(node.data.id);
            break;
          case LibraryItem.SONG:
            songId.push(node.data.id);
            break;
        }
      }
    } else {
      for (const item of ctx.data) {
        switch (item.type) {
          case LibraryItem.ALBUM:
            albumId.push(item.id);
            break;
          case LibraryItem.ARTIST:
            artistId.push(item.id);
            break;
          case LibraryItem.SONG:
            songId.push(item.id);
            break;
        }
      }
    }

    openContextModal({
      innerProps: {
        albumId: albumId.length > 0 ? albumId : undefined,
        artistId: artistId.length > 0 ? artistId : undefined,
        songId: songId.length > 0 ? songId : undefined,
      },
      modal: 'addToPlaylist',
      size: 'md',
      title: 'Add to playlist',
    });
  }, [ctx.data, ctx.dataNodes]);

  const removeFromPlaylistMutation = useRemoveFromPlaylist();

  const handleRemoveFromPlaylist = useCallback(() => {
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
  }, [
    ctx.context?.playlistId,
    ctx.context?.tableRef,
    ctx.dataNodes,
    removeFromPlaylistMutation,
    serverType,
  ]);

  const updateRatingMutation = useUpdateRating();

  const handleUpdateRating = useCallback(
    (rating: number) => {
      if (!ctx.dataNodes || !ctx.data) return;

      let uniqueServerIds: string[] = [];
      let items: AnyLibraryItems = [];

      if (ctx.dataNodes) {
        uniqueServerIds = ctx.dataNodes.reduce((acc, node) => {
          if (!acc.includes(node.data.serverId)) {
            acc.push(node.data.serverId);
          }
          return acc;
        }, [] as string[]);
      } else {
        uniqueServerIds = ctx.data.reduce((acc, item) => {
          if (!acc.includes(item.serverId)) {
            acc.push(item.serverId);
          }
          return acc;
        }, [] as string[]);
      }

      for (const serverId of uniqueServerIds) {
        if (ctx.dataNodes) {
          items = ctx.dataNodes
            .filter((node) => node.data.serverId === serverId)
            .map((node) => node.data);
        } else {
          items = ctx.data.filter((item) => item.serverId === serverId);
        }

        updateRatingMutation.mutate({
          _serverId: serverId,
          query: {
            item: items,
            rating,
          },
        });
      }
    },
    [ctx.data, ctx.dataNodes, updateRatingMutation],
  );

  const contextMenuItems: Record<ContextMenuItemType, ContextMenuItem> = useMemo(() => {
    return {
      addToFavorites: {
        id: 'addToFavorites',
        label: 'Add to favorites',
        leftIcon: <RiHeartFill size="1.1rem" />,
        onClick: handleAddToFavorites,
      },
      addToPlaylist: {
        id: 'addToPlaylist',
        label: 'Add to playlist',
        leftIcon: <RiPlayListAddFill size="1.1rem" />,
        onClick: handleAddToPlaylist,
      },
      createPlaylist: { id: 'createPlaylist', label: 'Create playlist', onClick: () => {} },
      deletePlaylist: {
        id: 'deletePlaylist',
        label: 'Delete playlist',
        leftIcon: <RiDeleteBinFill size="1.1rem" />,
        onClick: openDeletePlaylistModal,
      },
      play: {
        id: 'play',
        label: 'Play',
        leftIcon: <RiPlayFill size="1.1rem" />,
        onClick: () => handlePlay(Play.NOW),
      },
      playLast: {
        id: 'playLast',
        label: 'Add to queue',
        leftIcon: <RiAddBoxFill size="1.1rem" />,
        onClick: () => handlePlay(Play.LAST),
      },
      playNext: {
        id: 'playNext',
        label: 'Add to queue next',
        leftIcon: <RiAddCircleFill size="1.1rem" />,
        onClick: () => handlePlay(Play.NEXT),
      },
      removeFromFavorites: {
        id: 'removeFromFavorites',
        label: 'Remove from favorites',
        leftIcon: <RiDislikeFill size="1.1rem" />,
        onClick: handleRemoveFromFavorites,
      },
      removeFromPlaylist: {
        id: 'removeFromPlaylist',
        label: 'Remove from playlist',
        leftIcon: <RiDeleteBinFill size="1.1rem" />,
        onClick: handleRemoveFromPlaylist,
      },
      setRating: {
        children: [
          {
            id: 'zeroStar',
            label: (
              <Rating
                readOnly
                value={0}
                onClick={() => {}}
              />
            ),
            onClick: () => handleUpdateRating(0),
          },
          {
            id: 'oneStar',
            label: (
              <Rating
                readOnly
                value={1}
                onClick={() => {}}
              />
            ),
            onClick: () => handleUpdateRating(1),
          },
          {
            id: 'twoStar',
            label: (
              <Rating
                readOnly
                value={2}
                onClick={() => {}}
              />
            ),
            onClick: () => handleUpdateRating(2),
          },
          {
            id: 'threeStar',
            label: (
              <Rating
                readOnly
                value={3}
                onClick={() => {}}
              />
            ),
            onClick: () => handleUpdateRating(3),
          },
          {
            id: 'fourStar',
            label: (
              <Rating
                readOnly
                value={4}
                onClick={() => {}}
              />
            ),
            onClick: () => handleUpdateRating(4),
          },
          {
            id: 'fiveStar',
            label: (
              <Rating
                readOnly
                value={5}
                onClick={() => {}}
              />
            ),
            onClick: () => handleUpdateRating(5),
          },
        ],
        id: 'setRating',
        label: 'Set rating',
        leftIcon: <RiStarFill size="1.1rem" />,
        onClick: () => {},
        rightIcon: <RiArrowRightSFill size="1.2rem" />,
      },
    };
  }, [
    handleAddToFavorites,
    handleAddToPlaylist,
    handlePlay,
    handleRemoveFromFavorites,
    handleRemoveFromPlaylist,
    handleUpdateRating,
    openDeletePlaylistModal,
  ]);

  const mergedRef = useMergedRef(ref, clickOutsideRef);

  return (
    <ContextMenuContext.Provider
      value={{
        closeContextMenu,
        openContextMenu,
      }}
    >
      <Portal>
        <AnimatePresence>
          {opened && (
            <ContextMenu
              ref={mergedRef}
              minWidth={125}
              xPos={ctx.xPos}
              yPos={ctx.yPos}
            >
              <Stack spacing={0}>
                <Stack
                  spacing={0}
                  onClick={closeContextMenu}
                >
                  {ctx.menuItems?.map((item) => {
                    return (
                      <Fragment key={`context-menu-${item.id}`}>
                        {item.children ? (
                          <HoverCard
                            offset={5}
                            position="right"
                          >
                            <HoverCard.Target>
                              <ContextMenuButton
                                disabled={item.disabled}
                                leftIcon={contextMenuItems[item.id].leftIcon}
                                rightIcon={contextMenuItems[item.id].rightIcon}
                                onClick={contextMenuItems[item.id].onClick}
                              >
                                {contextMenuItems[item.id].label}
                              </ContextMenuButton>
                            </HoverCard.Target>
                            <HoverCard.Dropdown>
                              <Stack spacing={0}>
                                {contextMenuItems[item.id].children?.map((child) => (
                                  <>
                                    <ContextMenuButton
                                      key={`sub-${child.id}`}
                                      disabled={child.disabled}
                                      leftIcon={child.leftIcon}
                                      rightIcon={child.rightIcon}
                                      onClick={child.onClick}
                                    >
                                      {child.label}
                                    </ContextMenuButton>
                                  </>
                                ))}
                              </Stack>
                            </HoverCard.Dropdown>
                          </HoverCard>
                        ) : (
                          <ContextMenuButton
                            disabled={item.disabled}
                            leftIcon={contextMenuItems[item.id].leftIcon}
                            rightIcon={contextMenuItems[item.id].rightIcon}
                            onClick={contextMenuItems[item.id].onClick}
                          >
                            {contextMenuItems[item.id].label}
                          </ContextMenuButton>
                        )}

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
                <Divider
                  color="rgb(62, 62, 62)"
                  size="sm"
                />
                <ContextMenuButton disabled>{ctx.data?.length} selected</ContextMenuButton>
              </Stack>
            </ContextMenu>
          )}
        </AnimatePresence>
        {children}
      </Portal>
    </ContextMenuContext.Provider>
  );
};
