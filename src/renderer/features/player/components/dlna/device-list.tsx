import { Loader } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import type { DlnaDevice } from './types';

import { Group } from '/@/shared/components/group/group';
import { AppIcon } from '/@/shared/components/icon/icon';
import { Text } from '/@/shared/components/text/text';

export const DeviceList = ({
    devices,
    disabledIds = [],
    isLoading,
    onSelect,
}: {
    devices: DlnaDevice[];
    disabledIds?: string[];
    isLoading: boolean;
    onSelect: (device: DlnaDevice) => void;
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
        return (
            <Group p="sm">
                <AppIcon.circleSlash size={12} />
                <Text c="dimmed">{t('dlna.noDevicesFound')}</Text>
            </Group>
        );
    }

    return (
        <>
            {devices.map((device) => {
                const disabled = disabledIds.includes(device.id);
                return (
                    <div
                        key={device.id}
                        onClick={() => !disabled && onSelect(device)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !disabled) onSelect(device);
                        }}
                        role="button"
                        style={{
                            borderRadius: '4px',
                            color: disabled ? '#555' : '#e0e0e0',
                            cursor: disabled ? 'default' : 'pointer',
                            fontSize: '0.8rem',
                            padding: '6px 12px',
                        }}
                        tabIndex={disabled ? -1 : 0}
                    >
                        {device.name}
                        {disabled && (
                            <Text c="primary" display="inline" ml={6} size="xs">
                                {t('dlna.connected')}
                            </Text>
                        )}
                    </div>
                );
            })}
        </>
    );
};
