import { MutableRefObject, useCallback } from 'react';

import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid/virtual-infinite-grid';
import { useCreateFavorite } from '/@/renderer/features/shared/mutations/create-favorite-mutation';
import { useDeleteFavorite } from '/@/renderer/features/shared/mutations/delete-favorite-mutation';
import { LibraryItem } from '/@/shared/types/domain-types';
import { ServerListItem } from '/@/shared/types/types';

interface HandleFavoriteProps {
    gridRef: MutableRefObject<null | VirtualInfiniteGridRef>;
    server: null | ServerListItem;
}

export const useHandleFavorite = ({ gridRef, server }: HandleFavoriteProps) => {
    const createFavoriteMutation = useCreateFavorite({});
    const deleteFavoriteMutation = useDeleteFavorite({});

    const handleFavorite = useCallback(
        async (options: { id: string[]; isFavorite: boolean; itemType: LibraryItem }) => {
            const { id, isFavorite, itemType } = options;
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
