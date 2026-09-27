import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import styles from './offline-status-icon.module.css';

import { useOfflineItemStatus } from '/@/renderer/features/offline/offline-download.store';
import { Icon } from '/@/shared/components/icon/icon';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';
import { LibraryItem } from '/@/shared/types/domain-types';

interface OfflineStatusIconProps {
    item: {
        _serverId?: string;
        id: string;
        songCount?: null | number;
    };
    itemType: LibraryItem;
    variant?: 'badge' | 'inline';
}

export const OfflineStatusIcon = ({
    item,
    itemType,
    variant = 'inline',
}: OfflineStatusIconProps) => {
    const { t } = useTranslation();
    const status = useOfflineItemStatus(item, itemType);

    if (status.state === 'none') return null;

    const label =
        status.state === 'complete'
            ? t('offline.available', 'Available offline')
            : status.state === 'downloading'
              ? t('offline.downloading', {
                    defaultValue: 'Downloading {{progress}}%',
                    progress: status.progress,
                })
              : status.state === 'partial'
                ? t('offline.partial', {
                      defaultValue: 'Partially downloaded ({{downloaded}}/{{total}})',
                      downloaded: status.downloaded,
                      total: status.total,
                  })
                : t('offline.failed', 'Download failed');

    const icon =
        status.state === 'complete'
            ? ('success' as const)
            : status.state === 'downloading'
              ? ('spinner' as const)
              : status.state === 'error'
                ? ('warn' as const)
                : ('download' as const);
    const color =
        status.state === 'complete'
            ? ('success' as const)
            : status.state === 'error'
              ? ('error' as const)
              : status.state === 'partial'
                ? ('warn' as const)
                : ('primary' as const);

    return (
        <Tooltip label={label}>
            <span aria-label={label} className={clsx(styles.root, styles[variant])} role="img">
                <Icon
                    animate={status.state === 'downloading' ? 'spin' : undefined}
                    color={color}
                    icon={icon}
                    size={variant === 'badge' ? 'lg' : 'sm'}
                />
            </span>
        </Tooltip>
    );
};
