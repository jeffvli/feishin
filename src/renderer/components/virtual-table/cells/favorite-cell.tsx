import type { ICellRendererParams } from '@ag-grid-community/core';

import { RiHeartFill, RiHeartLine } from 'react-icons/ri';

import { CellContainer } from '/@/renderer/components/virtual-table/cells/generic-cell';
import { useCreateFavorite, useDeleteFavorite } from '/@/renderer/features/shared';
import { Button } from '/@/shared/components/button/button';

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
            <Button
                onClick={handleToggleFavorite}
                size="compact-md"
                style={{
                    svg: {
                        fill: !value
                            ? 'var(--theme-colors-foreground-muted) !important'
                            : 'var(--theme-colors-primary-filled) !important',
                    },
                }}
                variant="subtle"
            >
                {!value ? <RiHeartLine /> : <RiHeartFill />}
            </Button>
        </CellContainer>
    );
};
