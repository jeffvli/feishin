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
    items: ItemDetailsModalProps['item'][];
}

export const GetInfoAction = ({ disabled, items }: GetInfoActionProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();

    const onSelect = useCallback(async () => {
        if (!server || items.length === 0) return;

        const filteredItems = items.filter(
            (item): item is NonNullable<typeof item> => item !== undefined,
        );

        if (filteredItems.length === 0) return;

        openModal({
            children: <ItemDetailsModal items={filteredItems} />,
            size: 'lg',
            styles: {
                body: { paddingBottom: 'var(--theme-spacing-xl)' },
            },
            title:
                filteredItems.length === 1
                    ? filteredItems[0]?.name ||
                      t('page.contextMenu.showDetails', { postProcess: 'sentenceCase' })
                    : t('page.contextMenu.showDetails', { postProcess: 'sentenceCase' }),
        });
    }, [items, server, t]);

    return (
        <ContextMenu.Item disabled={disabled} leftIcon="info" onSelect={onSelect}>
            {t('page.contextMenu.showDetails', { postProcess: 'sentenceCase' })}
        </ContextMenu.Item>
    );
};
