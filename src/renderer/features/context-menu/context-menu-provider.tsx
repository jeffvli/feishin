import { Stack } from '@mantine/core';
import { useClickOutside, useResizeObserver, useSetState, useViewportSize } from '@mantine/hooks';
import { createContext, useMemo, useState } from 'react';
import { ContextMenu, ContextMenuButton } from '/@/renderer/components';
import {
  OpenContextMenuProps,
  SetContextMenuItems,
  useContextMenuEvents,
} from '/@/renderer/features/context-menu/events';
import { useHandlePlayQueueAdd } from '/@/renderer/features/player/hooks/use-handle-playqueue-add';
import { LibraryItem, Play } from '/@/renderer/types';

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
  const [ctx, setCtx] = useSetState<{
    data: any[];
    menuItems: SetContextMenuItems;
    type: LibraryItem;
    xPos: number;
    yPos: number;
  }>({
    data: [],
    menuItems: [],
    type: LibraryItem.SONG,
    xPos: 0,
    yPos: 0,
  });

  const handlePlayQueueAdd = useHandlePlayQueueAdd();

  const openContextMenu = (args: OpenContextMenuProps) => {
    const { xPos, yPos, menuItems, data } = args;

    const shouldReverseY = yPos + menuRect.height > viewport.height;
    const shouldReverseX = xPos + menuRect.width > viewport.width;

    const calculatedXPos = shouldReverseX ? xPos - menuRect.width : xPos;
    const calculatedYPos = shouldReverseY ? yPos - menuRect.height : yPos;

    setCtx({ data, menuItems, xPos: calculatedXPos, yPos: calculatedYPos });
    setOpened(true);
  };

  const closeContextMenu = () => {
    setOpened(false);
  };

  useContextMenuEvents({
    closeContextMenu,
    openContextMenu,
  });

  const contextMenuItems = useMemo(() => {
    return {
      addToFavorites: { id: 'addToFavorites', label: 'Add to favorites', onClick: () => {} },
      addToPlaylist: { id: 'addToPlaylist', label: 'Add to playlist', onClick: () => {} },
      play: {
        id: 'play',
        label: 'Play',
        onClick: () => {
          if (ctx.type === LibraryItem.SONG) {
            handlePlayQueueAdd({ byData: ctx.data, play: Play.NOW });
          }
        },
      },
      playLast: {
        id: 'playLast',
        label: 'Play Last',
        onClick: () => {
          if (ctx.type === LibraryItem.SONG) {
            handlePlayQueueAdd({ byData: ctx.data, play: Play.LAST });
          }
        },
      },
      playNext: {
        id: 'playNext',
        label: 'Play Next',
        onClick: () => {
          if (ctx.type === LibraryItem.SONG) {
            handlePlayQueueAdd({ byData: ctx.data, play: Play.NEXT });
          }
        },
      },
      removeFromFavorites: {
        id: 'removeFromFavorites',
        label: 'Remove from favorites',
        onClick: () => {},
      },
      setRating: { id: 'setRating', label: 'Set rating', onClick: () => {} },
    };
  }, [ctx.data, ctx.type, handlePlayQueueAdd]);

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
                <ContextMenuButton
                  key={`context-menu-${item.id}`}
                  disabled={item.disabled}
                  variant="default"
                  onClick={contextMenuItems[item.id].onClick}
                >
                  {contextMenuItems[item.id].label}
                </ContextMenuButton>
              );
            })}
          </Stack>
        </ContextMenu>
      )}

      {children}
    </ContextMenuContext.Provider>
  );
};
