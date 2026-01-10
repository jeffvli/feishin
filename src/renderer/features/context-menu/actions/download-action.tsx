import isElectron from 'is-electron';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '/@/renderer/api';
import { useCurrentServer } from '/@/renderer/store';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { toast } from '/@/shared/components/toast/toast';

interface DownloadActionProps {
    ids: string[];
}

const utils = isElectron() ? window.api.utils : null;

export const DownloadAction = ({ ids }: DownloadActionProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();

    const onSelect = useCallback(async () => {
        if (!utils) {
            return;
        }

        try {
            for (const id of ids) {
                const downloadUrl = api.controller.getDownloadUrl({
                    apiClientProps: { serverId: server.id },
                    query: { id },
                });

                utils.download(downloadUrl);
            }

            toast.success({
                message: t('action.downloadStarted', {
                    count: ids.length,
                    postProcess: 'sentenceCase',
                }),
            });
        } catch (error) {
            console.error('Failed to download items:', error);
        }
    }, [ids, server, t]);

    if (!utils) {
        return null;
    }

    return (
        <ContextMenu.Item disabled={ids.length > 1} leftIcon="download" onSelect={onSelect}>
            {t('page.contextMenu.download', { postProcess: 'sentenceCase' })}
        </ContextMenu.Item>
    );
};
