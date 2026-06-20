import { useState } from 'react';

import { useSyncActions, useSyncRoom, useSyncSettings } from '/@/renderer/store/sync.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Badge } from '/@/shared/components/badge/badge';
import { Button } from '/@/shared/components/button/button';
import { CopyButton } from '/@/shared/components/copy-button/copy-button';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { Popover } from '/@/shared/components/popover/popover';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';

export const ListenTogetherControl = () => {
    const { enabled, sidecarUrl } = useSyncSettings();
    const room = useSyncRoom();
    const actions = useSyncActions();

    const [opened, setOpened] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [urlDraft, setUrlDraft] = useState(sidecarUrl);

    const inRoom = !!room.roomId;

    return (
        <Popover
            onChange={setOpened}
            opened={opened}
            position="top"
            shadow="md"
            width={320}
            withArrow
        >
            <Popover.Target>
                <Button
                    onClick={() => setOpened((o) => !o)}
                    size="compact-sm"
                    variant={inRoom ? 'filled' : 'subtle'}
                >
                    {inRoom ? `Room ${room.roomId}` : 'Listen Together'}
                </Button>
            </Popover.Target>

            <Popover.Dropdown>
                <Stack gap="sm">
                    <Group justify="space-between">
                        <Text fw={600}>Listen Together</Text>
                        <Switch
                            aria-label="Enable Listen Together"
                            checked={enabled}
                            label="Enabled"
                            onChange={(e) => actions.setEnabled(e.currentTarget.checked)}
                        />
                    </Group>

                    {enabled && (
                        <>
                            <Group align="flex-end" gap="xs" wrap="nowrap">
                                <TextInput
                                    label="Sync server URL"
                                    onChange={(e) => setUrlDraft(e.currentTarget.value)}
                                    placeholder="https://party.example.com"
                                    style={{ flex: 1 }}
                                    value={urlDraft}
                                />
                                <Button
                                    disabled={urlDraft.trim() === sidecarUrl}
                                    onClick={() => actions.setSidecarUrl(urlDraft.trim())}
                                    size="compact-sm"
                                    variant="default"
                                >
                                    Save
                                </Button>
                            </Group>

                            {inRoom ? (
                                <RoomPanel actions={actions} room={room} />
                            ) : (
                                <>
                                    <Button fullWidth onClick={() => actions.createRoom()}>
                                        Create a room
                                    </Button>
                                    <Divider label="or join" labelPosition="center" />
                                    <Group align="flex-end" gap="xs" wrap="nowrap">
                                        <TextInput
                                            label="Room code"
                                            onChange={(e) =>
                                                setJoinCode(e.currentTarget.value.toUpperCase())
                                            }
                                            placeholder="G7KQ2M"
                                            style={{ flex: 1 }}
                                            value={joinCode}
                                        />
                                        <Button
                                            disabled={joinCode.trim().length < 4}
                                            onClick={() => actions.joinRoom(joinCode)}
                                            size="compact-sm"
                                        >
                                            Join
                                        </Button>
                                    </Group>
                                </>
                            )}
                        </>
                    )}
                </Stack>
            </Popover.Dropdown>
        </Popover>
    );
};

interface RoomPanelProps {
    actions: ReturnType<typeof useSyncActions>;
    room: ReturnType<typeof useSyncRoom>;
}

const RoomPanel = ({ actions, room }: RoomPanelProps) => (
    <Stack gap="xs">
        <Group justify="space-between">
            <Group gap="xs">
                <Text isMuted size="sm">
                    Code
                </Text>
                <Text fw={700}>{room.roomId}</Text>
            </Group>
            <Group gap="xs">
                <CopyButton value={room.roomId}>
                    {({ copied, copy }) => (
                        <Button onClick={copy} size="compact-xs" variant="default">
                            {copied ? 'Copied' : 'Copy'}
                        </Button>
                    )}
                </CopyButton>
                <Badge color={room.connected ? 'teal' : 'red'} variant="light">
                    {room.connected ? 'live' : 'offline'}
                </Badge>
            </Group>
        </Group>

        <Stack gap={4} style={{ maxHeight: 160, overflowY: 'auto' }}>
            {room.members.map((m) => {
                const isMemberHost = m.id === room.hostMemberId;
                const isMe = m.id === room.memberId;
                return (
                    <Group justify="space-between" key={m.id}>
                        <Group gap="xs">
                            <Text size="sm">
                                {m.username}
                                {isMe ? ' (you)' : ''}
                            </Text>
                            {isMemberHost && (
                                <Badge color="blue" size="xs" variant="light">
                                    host
                                </Badge>
                            )}
                        </Group>
                        {room.isHost && !isMemberHost && (
                            <Tooltip label="Give control">
                                <ActionIcon
                                    onClick={() => actions.passControl(m.id)}
                                    size="sm"
                                    variant="subtle"
                                >
                                    ⇄
                                </ActionIcon>
                            </Tooltip>
                        )}
                    </Group>
                );
            })}
        </Stack>

        <Group grow>
            {!room.isHost && (
                <Button onClick={() => actions.requestControl()} variant="default">
                    Request control
                </Button>
            )}
            <Button onClick={() => actions.leaveRoom()} variant="state-error">
                Leave
            </Button>
        </Group>
    </Stack>
);
