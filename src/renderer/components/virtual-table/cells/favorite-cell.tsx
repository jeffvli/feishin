/* eslint-disable import/no-cycle */
import type { ICellRendererParams } from '@ag-grid-community/core';
import { RiHeartFill, RiHeartLine } from 'react-icons/ri';
import { Button } from '/@/renderer/components/button';
import { CellContainer } from '/@/renderer/components/virtual-table/cells/generic-cell';
import { useCreateFavorite, useDeleteFavorite } from '/@/renderer/features/shared';

export const FavoriteCell = ({ value, data, node }: ICellRendererParams) => {
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
