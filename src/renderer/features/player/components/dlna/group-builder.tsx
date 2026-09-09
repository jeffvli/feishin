import { Loader } from '@mantine/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { DlnaDevice } from './types';

import styles from './group-builder.module.css';

import { Button } from '/@/shared/components/button/button';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { Group } from '/@/shared/components/group/group';
import { AppIcon } from '/@/shared/components/icon/icon';
import { Text } from '/@/shared/components/text/text';

export const GroupBuilder = ({
    devices,
    isLoading,
    lockedCoordinator,
    onCancel,
    onConfirm,
    onRefresh,
}: {
    devices: DlnaDevice[];
    isLoading: boolean;
    lockedCoordinator?: DlnaDevice;
    onCancel: () => void;
    onConfirm: (selected: DlnaDevice[], coordinator: DlnaDevice) => void;
    onRefresh: () => void;
}) => {
    const [checked, setChecked] = useState<DlnaDevice[]>(
        lockedCoordinator ? [lockedCoordinator] : [],
    );

    const toggle = (device: DlnaDevice) => {
        if (lockedCoordinator && device.id === lockedCoordinator.id) return;
        if (device.isPair) return;
        setChecked((prev) =>
            prev.some((d) => d.id === device.id)
                ? prev.filter((d) => d.id !== device.id)
                : [...prev, device],
        );
    };

    const coordinator = lockedCoordinator ?? checked[0];
    const canConfirm = checked.length >= 2;
    const { t } = useTranslation();

    return (
        <>
            <Text fw="600" pb="md" size="sm" ta="center">
                {lockedCoordinator ? t('dlna.group.addSpeakers') : t('dlna.group.selectSpeakers')}
            </Text>

            {isLoading && (
                <Group p="sm">
                    <Loader color="gray" size={12} type="bars" />
                    <Text c="dimmed">{t('dlna.group.searching')}</Text>
                </Group>
            )}
            {!isLoading && devices.length === 0 && (
                <Group p="sm">
                    <AppIcon.circleSlash size={12} />
                    <Text c="dimmed">{t('dlna.group.noSonosFound')}</Text>
                </Group>
            )}

            {devices.map((device) => (
                <GroupDeviceItem
                    checked={checked.some((item) => item.id === device.id)}
                    device={device}
                    disabled={lockedCoordinator?.id === device.id || Boolean(device.isPair)}
                    isCoordinator={device.id === coordinator?.id}
                    key={device.id}
                    onToggle={toggle}
                />
            ))}

            {!lockedCoordinator && (
                <Text c="dimmed" px="sm" size="xs">
                    {t('dlna.group.firstSelectedIsCoordinator')}
                </Text>
            )}

            <Group gap="xs" mt="sm">
                <Button
                    disabled={isLoading}
                    flex={1}
                    leftSection={<AppIcon.refresh size={12} />}
                    onClick={onRefresh}
                    size="xs"
                    variant="outline"
                >
                    {t('dlna.group.refresh')}
                </Button>
                <Button color="gray" flex={1} onClick={onCancel} size="xs" variant="outline">
                    {t('dlna.group.cancel')}
                </Button>
                <Button
                    disabled={!canConfirm}
                    flex={1}
                    onClick={() => coordinator && onConfirm(checked, coordinator)}
                    size="xs"
                    variant="filled"
                >
                    {lockedCoordinator ? t('dlna.group.add') : t('dlna.group.connect')}
                </Button>
            </Group>
        </>
    );
};

const GroupDeviceItem = ({
    checked,
    device,
    disabled,
    isCoordinator,
    onToggle,
}: {
    checked: boolean;
    device: DlnaDevice;
    disabled: boolean;
    isCoordinator: boolean;
    onToggle: (device: DlnaDevice) => void;
}) => {
    const { t } = useTranslation();

    return (
        <Checkbox
            checked={checked}
            className={styles.device}
            disabled={disabled}
            label={
                <Group gap="xs">
                    <Text size="sm">{device.name}</Text>
                    {isCoordinator && (
                        <Text c="primary" size="xs">
                            {t('dlna.group.coordinator')}
                        </Text>
                    )}
                </Group>
            }
            onChange={() => onToggle(device)}
        />
    );
};
