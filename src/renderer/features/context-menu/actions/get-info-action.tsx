import { openModal } from '@mantine/modals';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import {
    ItemDetailsModal,
    ItemDetailsModalProps,
} from '/@/renderer/features/item-details/components/item-details-modal';
import { useCurrentServer } from '/@/renderer/store';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';

interface GetInfoActionProps {
    disabled?: boolean;
    item: ItemDetailsModalProps['item'];
}

export const GetInfoAction = ({ disabled, item }: GetInfoActionProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();

    const onSelect = useCallback(async () => {
        if (!server) return;

        openModal({
            children: <ItemDetailsModal item={item} />,
            size: 'lg',
            title: item.name || t('page.contextMenu.showDetails', { postProcess: 'sentenceCase' }),
        });
    }, [item, server, t]);

    return (
        <ContextMenu.Item disabled={disabled} leftIcon="info" onSelect={onSelect}>
            {t('page.contextMenu.showDetails', { postProcess: 'sentenceCase' })}
        </ContextMenu.Item>
    );
};
