import isElectron from 'is-electron';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { resolveSongPath } from '/@/renderer/utils/resolve-song-path';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { toast } from '/@/shared/components/toast/toast';
import { QueueSong, Song } from '/@/shared/types/domain-types';

interface ShowInFileExplorerActionProps {
    items: QueueSong[] | Song[];
}

const utils = isElectron() ? window.api.utils : null;

export const ShowInFileExplorerAction = ({ items }: ShowInFileExplorerActionProps) => {
    const { t } = useTranslation();

    const onSelect = useCallback(async () => {
        if (!utils) {
            return;
        }

        const firstItem = items[0];
        const resolvedPath = resolveSongPath(firstItem?.path);
        if (!resolvedPath) {
            return;
        }

        try {
            await utils.openItem(resolvedPath);
        } catch (error) {
            toast.error({
                message: (error as Error).message,
                title: t('error.openError'),
            });
        }
    }, [items, t]);

    if (!utils) {
        return null;
    }

    const firstItem = items[0];
    const hasPath = firstItem?.path !== null;
    const isDisabled = items.length > 1 || !hasPath;

    return (
        <ContextMenu.Item disabled={isDisabled} leftIcon="folder" onSelect={onSelect}>
            {t('page.itemDetail.openFile')}
        </ContextMenu.Item>
    );
};
