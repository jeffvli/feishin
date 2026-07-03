import React, { memo } from 'react';

import styles from './settings-option.module.css';

import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';

interface SettingsOptionProps {
    control: React.ReactNode;
    description?: React.ReactNode | string;
    indent?: boolean;
    note?: string;
    title: React.ReactNode | string;
}

export const SettingsOptions = memo(
    ({ control, description, indent, note, title }: SettingsOptionProps) => {
        return (
            <>
                <Group
                    className={indent ? styles.rowIndented : styles.row}
                    justify="space-between"
                    wrap="nowrap"
                >
                    <Stack
                        gap="xs"
                        style={{
                            alignSelf: 'flex-start',
                            display: 'flex',
                            maxWidth: '50%',
                        }}
                    >
                        <Group>
                            <Text isNoSelect size="md">
                                {title}
                            </Text>
                            {note && (
                                <Tooltip label={note} openDelay={0}>
                                    <Icon icon="info" />
                                </Tooltip>
                            )}
                        </Group>
                        {React.isValidElement(description) ? (
                            description
                        ) : (
                            <Text isMuted isNoSelect size="sm">
                                {description}
                            </Text>
                        )}
                    </Stack>
                    <Group justify="flex-end">{control}</Group>
                </Group>
            </>
        );
    },
);
