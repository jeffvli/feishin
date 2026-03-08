import isElectron from 'is-electron';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '/@/renderer/api';
import { useCurrentServerId } from '/@/renderer/store';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';

interface DownloadActionProps {
    ids: string[];
}

const utils = isElectron() ? window.api.utils : null;

export const DownloadAction = ({ ids }: DownloadActionProps) => {
    const { t } = useTranslation();
    const serverId = useCurrentServerId();

    const onSelect = useCallback(async () => {
        try {
            for (const id of ids) {
                const downloadUrl = api.controller.getDownloadUrl({
                    apiClientProps: { serverId },
                    query: { id },
                });

                if (isElectron()) {
                    utils?.download(downloadUrl);
                } else {
                    window.open(downloadUrl, '_blank');
                }
            }
        } catch (error) {
            console.error('Failed to download items:', error);
        }
    }, [ids, serverId]);

    return (
        <ContextMenu.Item disabled={ids.length > 1} leftIcon="download" onSelect={onSelect}>
            {t('page.contextMenu.download', { postProcess: 'sentenceCase' })}
        </ContextMenu.Item>
    );
};
