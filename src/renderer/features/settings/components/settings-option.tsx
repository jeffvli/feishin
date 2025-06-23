import React from 'react';

import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';

interface SettingsOptionProps {
    control: React.ReactNode;
    description?: React.ReactNode | string;
    note?: string;
    title: React.ReactNode | string;
}

export const SettingsOptions = ({ control, description, note, title }: SettingsOptionProps) => {
    return (
        <>
            <Group
                justify="space-between"
                style={{ alignItems: 'center' }}
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
                        <Text
                            isNoSelect
                            size="md"
                        >
                            {title}
                        </Text>
                        {note && (
                            <Tooltip
                                label={note}
                                openDelay={0}
                            >
                                <Icon icon="info" />
                            </Tooltip>
                        )}
                    </Group>
                    {React.isValidElement(description) ? (
                        description
                    ) : (
                        <Text
                            isMuted
                            isNoSelect
                            size="sm"
                        >
                            {description}
                        </Text>
                    )}
                </Stack>
                <Group justify="flex-end">{control}</Group>
            </Group>
        </>
    );
};
