import type { ICellRendererParams } from '@ag-grid-community/core';
import { RiHeartFill, RiHeartLine } from 'react-icons/ri';
import { Button } from '/@/renderer/components/button';
import { CellContainer } from '/@/renderer/components/virtual-table/cells/generic-cell';
import { useMutation } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { api } from '/@/renderer/api';
import { RawFavoriteResponse, FavoriteArgs, LibraryItem } from '/@/renderer/api/types';
import { useCurrentServer, useSetQueueFavorite } from '/@/renderer/store';

const useCreateFavorite = () => {
  const server = useCurrentServer();

  return useMutation<RawFavoriteResponse, HTTPError, Omit<FavoriteArgs, 'server'>, null>({
    mutationFn: (args) => api.controller.createFavorite({ ...args, server }),
  });
};

const useDeleteFavorite = () => {
  const server = useCurrentServer();

  return useMutation<RawFavoriteResponse, HTTPError, Omit<FavoriteArgs, 'server'>, null>({
    mutationFn: (args) => api.controller.deleteFavorite({ ...args, server }),
  });
};

export const FavoriteCell = ({ value, data, node }: ICellRendererParams) => {
  const createMutation = useCreateFavorite();
  const deleteMutation = useDeleteFavorite();

  // Since the queue is using client-side state, we need to update it manually
  const setFavorite = useSetQueueFavorite();

  const handleToggleFavorite = () => {
    const newFavoriteValue = !value;

    if (newFavoriteValue) {
      createMutation.mutate(
        {
          query: {
            id: [data.id],
            type: data.itemType,
          },
        },
        {
          onSuccess: () => {
            if (data.itemType === LibraryItem.SONG) {
              setFavorite([data.id], newFavoriteValue);
            }

            node.setData({ ...data, userFavorite: newFavoriteValue });
          },
        },
      );
    } else {
      deleteMutation.mutate(
        {
          query: {
            id: [data.id],
            type: data.itemType,
          },
        },
        {
          onSuccess: () => {
            if (data.itemType === LibraryItem.SONG) {
              setFavorite([data.id], newFavoriteValue);
            }

            node.setData({ ...data, userFavorite: newFavoriteValue });
          },
        },
      );
    }
  };

  return (
    <CellContainer position="center">
      <Button
        compact
        sx={{
          svg: {
            fill: !value
              ? 'var(--main-fg-secondary) !important'
              : 'var(--primary-color) !important',
          },
        }}
        variant="subtle"
        onClick={handleToggleFavorite}
      >
        {!value ? <RiHeartLine size="1.3em" /> : <RiHeartFill size="1.3em" />}
      </Button>
    </CellContainer>
  );
};
