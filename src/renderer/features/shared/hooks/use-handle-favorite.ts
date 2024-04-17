import { MutableRefObject, useCallback } from 'react';
import { LibraryItem } from '/@/renderer/api/types';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { useCreateFavorite } from '/@/renderer/features/shared/mutations/create-favorite-mutation';
import { useDeleteFavorite } from '/@/renderer/features/shared/mutations/delete-favorite-mutation';
import { ServerListItem } from '/@/renderer/types';

interface HandleFavoriteProps {
    gridRef: MutableRefObject<VirtualInfiniteGridRef | null>;
    server: ServerListItem | null;
}

export const useHandleFavorite = ({ gridRef, server }: HandleFavoriteProps) => {
    const createFavoriteMutation = useCreateFavorite({});
    const deleteFavoriteMutation = useDeleteFavorite({});

    const handleFavorite = useCallback(
        async (options: { id: string[]; isFavorite: boolean; itemType: LibraryItem }) => {
            const { id, itemType, isFavorite } = options;
            try {
                if (isFavorite) {
                    await deleteFavoriteMutation.mutateAsync({
                        query: {
                            id,
                            type: itemType,
                        },
                        serverId: server?.id,
                    });
                } else {
                    await createFavoriteMutation.mutateAsync({
                        query: {
                            id,
                            type: itemType,
                        },
                        serverId: server?.id,
                    });
                }

                const idSet = new Set(id);
                gridRef.current?.updateItemData((data) =>
                    idSet.has(data.id)
                        ? {
                              ...data,
                              userFavorite: !isFavorite,
                          }
                        : data,
                );
            } catch (error) {
                console.error(error);
            }
        },
        [createFavoriteMutation, deleteFavoriteMutation, gridRef, server?.id],
    );

    return handleFavorite;
};
