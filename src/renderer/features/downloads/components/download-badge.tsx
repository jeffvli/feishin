import { useTranslation } from 'react-i18next';

import { useDownloadProgress, useIsSongDownloaded } from '/@/renderer/store';
import { Badge } from '/@/shared/components/badge/badge';

interface Props {
    serverId?: string;
    songId?: string;
}

export const DownloadBadge = ({ serverId, songId }: Props) => {
    const { t } = useTranslation();
    const isDownloaded = useIsSongDownloaded(serverId, songId);
    const progress = useDownloadProgress(serverId, songId);

    if (isDownloaded) {
        return <Badge>{t('common.downloaded', { defaultValue: 'Offline' })}</Badge>;
    }
    if (progress === 'downloading' || progress === 'queued') {
        return <Badge>{t('common.downloading', { defaultValue: 'Downloading…' })}</Badge>;
    }
    return null;
};
