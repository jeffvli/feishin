import { Loader } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import type { DlnaDevice } from './types';

import styles from './device-list.module.css';

import { Group } from '/@/shared/components/group/group';
import { AppIcon } from '/@/shared/components/icon/icon';
import { Text } from '/@/shared/components/text/text';

export const DeviceList = ({
    devices,
    disabledIds = [],
    isLoading,
    onSelect,
    showEmptyState = true,
}: {
    devices: DlnaDevice[];
    disabledIds?: string[];
    isLoading: boolean;
    onSelect: (device: DlnaDevice) => void;
    showEmptyState?: boolean;
}) => {
    const { t } = useTranslation();
    if (isLoading) {
        return (
            <Group justify={'center'} p="sm">
                <Loader color="gray" size={12} type="bars" />
                <Text c="dimmed">{t('dlna.searching')}</Text>
            </Group>
        );
    }

    if (devices.length === 0) {
        if (!showEmptyState) return null;
        return (
            <Group p="sm">
                <AppIcon.circleSlash size={12} />
                <Text c="dimmed">{t('dlna.noDevicesFound')}</Text>
            </Group>
        );
    }

    return (
        <>
            {devices.map((device) => (
                <DeviceListItem
                    device={device}
                    disabled={disabledIds.includes(device.id)}
                    key={device.id}
                    onSelect={onSelect}
                />
            ))}
        </>
    );
};

const DeviceListItem = ({
    device,
    disabled,
    onSelect,
}: {
    device: DlnaDevice;
    disabled: boolean;
    onSelect: (device: DlnaDevice) => void;
}) => {
    const { t } = useTranslation();

    return (
        <button
            className={styles.device}
            disabled={disabled}
            onClick={() => onSelect(device)}
            type="button"
        >
            {device.name}
            {disabled && (
                <Text c="primary" component="span" size="xs">
                    {t('dlna.connected')}
                </Text>
            )}
        </button>
    );
};
