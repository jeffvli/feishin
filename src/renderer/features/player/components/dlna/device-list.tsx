import { useTranslation } from 'react-i18next';

import type { DlnaDevice } from './types';

import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { AppIcon } from '/@/shared/components/icon/icon';
import { Spinner } from '/@/shared/components/spinner/spinner';
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
                <Spinner size="sm" />
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
        <Button
            disabled={disabled}
            fullWidth
            justify="space-between"
            onClick={() => onSelect(device)}
            variant={disabled ? 'filled' : 'subtle'}
        >
            {device.name}
            {disabled && (
                <Text component="span" size="xs">
                    {t('dlna.connected')}
                </Text>
            )}
        </Button>
    );
};
