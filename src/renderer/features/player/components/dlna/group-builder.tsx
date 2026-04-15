import { Loader } from '@mantine/core';
import { useState } from 'react';

import type { DlnaDevice } from './types';

import { Button } from '/@/shared/components/button/button';
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
        setChecked((prev) =>
            prev.some((d) => d.id === device.id)
                ? prev.filter((d) => d.id !== device.id)
                : [...prev, device],
        );
    };

    const coordinator = lockedCoordinator ?? checked[0];
    const canConfirm = checked.length >= 2;

    return (
        <>
            <Text fw="600" pb="md" size="sm" ta="center">
                {lockedCoordinator ? 'Add Speakers' : 'Select Group Speakers'}
            </Text>

            {isLoading && (
                <Group p="sm">
                    <Loader color="gray" size={12} type="bars" />
                    <Text c="dimmed">Searching…</Text>
                </Group>
            )}
            {!isLoading && devices.length === 0 && (
                <Group p="sm">
                    <AppIcon.circleSlash size={12} />
                    <Text c="dimmed">No Sonos devices found</Text>
                </Group>
            )}

            {devices.map((device) => {
                const isLocked = lockedCoordinator?.id === device.id;
                const isChecked = checked.some((d) => d.id === device.id);
                const isCoord = device.id === coordinator?.id;
                return (
                    <div
                        key={device.id}
                        onClick={() => toggle(device)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') toggle(device);
                        }}
                        role="button"
                        style={{
                            alignItems: 'center',
                            background: isChecked ? 'rgba(108,159,255,0.15)' : 'transparent',
                            borderRadius: '4px',
                            cursor: isLocked ? 'default' : 'pointer',
                            display: 'flex',
                            fontSize: '0.8rem',
                            gap: 8,
                            padding: '6px 12px',
                        }}
                        tabIndex={isLocked ? -1 : 0}
                    >
                        <span
                            style={{
                                background: isChecked ? '#6c9fff' : 'transparent',
                                border: `2px solid ${isChecked ? '#6c9fff' : '#555'}`,
                                borderRadius: 3,
                                display: 'inline-block',
                                flexShrink: 0,
                                height: 12,
                                width: 12,
                            }}
                        />
                        <Text c={isLocked ? 'dimmed' : undefined} size="sm">
                            {device.name}
                        </Text>
                        {isCoord && (
                            <Text c="primary" size="xs">
                                coordinator
                            </Text>
                        )}
                    </div>
                );
            })}

            {!lockedCoordinator && (
                <Text c="dimmed" px="sm" size="xs">
                    Select Coordinator first
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
                    Refresh
                </Button>
                <Button color="gray" flex={1} onClick={onCancel} size="xs" variant="outline">
                    Cancel
                </Button>
                <Button
                    disabled={!canConfirm}
                    flex={1}
                    onClick={() => coordinator && onConfirm(checked, coordinator)}
                    size="xs"
                    variant="filled"
                >
                    {lockedCoordinator ? 'Add' : 'Connect'}
                </Button>
            </Group>
        </>
    );
};
