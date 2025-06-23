import type { ICellRendererParams } from '@ag-grid-community/core';

import { CellContainer } from '/@/renderer/components/virtual-table/cells/generic-cell';
import { useCreateFavorite, useDeleteFavorite } from '/@/renderer/features/shared';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';

export const FavoriteCell = ({ data, node, value }: ICellRendererParams) => {
    const createMutation = useCreateFavorite({});
    const deleteMutation = useDeleteFavorite({});

    const handleToggleFavorite = () => {
        const newFavoriteValue = !value;

        if (newFavoriteValue) {
            createMutation.mutate(
                {
                    query: {
                        id: [data.id],
                        type: data.itemType,
                    },
                    serverId: data.serverId,
                },
                {
                    onSuccess: () => {
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
                    serverId: data.serverId,
                },
                {
                    onSuccess: () => {
                        node.setData({ ...data, userFavorite: newFavoriteValue });
                    },
                },
            );
        }
    };

    return (
        <CellContainer position="center">
            <ActionIcon
                icon="favorite"
                iconProps={{
                    fill: !value ? undefined : 'primary',
                }}
                onClick={handleToggleFavorite}
                size="sm"
                variant="subtle"
            />
        </CellContainer>
    );
};
