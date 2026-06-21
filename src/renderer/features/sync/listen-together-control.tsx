import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    usePendingControlRequest,
    useSyncActions,
    useSyncFollowing,
    useSyncHealth,
    useSyncRoom,
    useSyncSettings,
} from '/@/renderer/store/sync.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Badge } from '/@/shared/components/badge/badge';
import { Button } from '/@/shared/components/button/button';
import { CopyButton } from '/@/shared/components/copy-button/copy-button';
import { Divider } from '/@/shared/components/divider/divider';
import { Group } from '/@/shared/components/group/group';
import { ConfirmModal, Modal } from '/@/shared/components/modal/modal';
import { Popover } from '/@/shared/components/popover/popover';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { Tooltip } from '/@/shared/components/tooltip/tooltip';

const formatOffset = (ms: number) => `${ms >= 0 ? '+' : ''}${Math.round(ms)} ms`;

// Enabling the feature and setting the sync server URL live in Settings → Playback;
// this player-bar control only manages rooms, and is hidden until enabled there.
export const ListenTogetherControl = () => {
    const { t } = useTranslation();
    const { enabled, sidecarUrl } = useSyncSettings();
    const room = useSyncRoom();
    const actions = useSyncActions();
    const pendingRequest = usePendingControlRequest();

    const [opened, setOpened] = useState(false);
    const [joinCode, setJoinCode] = useState('');

    if (!enabled) return null;

    const inRoom = !!room.roomId;
    const configured = sidecarUrl.trim().length > 0;

    return (
        <>
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
                        {inRoom
                            ? t('listenTogether.room', { code: room.roomId })
                            : t('listenTogether.title')}
                    </Button>
                </Popover.Target>

                <Popover.Dropdown>
                    <Stack gap="sm">
                        <Text fw={600}>{t('listenTogether.title')}</Text>

                        {!configured ? (
                            <Text isMuted size="sm">
                                {t('listenTogether.setUrlInSettings')}
                            </Text>
                        ) : inRoom ? (
                            <RoomPanel actions={actions} room={room} />
                        ) : (
                            <>
                                <Button fullWidth onClick={() => actions.createRoom()}>
                                    {t('listenTogether.createRoom')}
                                </Button>
                                <Divider
                                    label={t('listenTogether.orJoin')}
                                    labelPosition="center"
                                />
                                <Group align="flex-end" gap="xs" wrap="nowrap">
                                    <TextInput
                                        label={t('listenTogether.roomCode')}
                                        onChange={(e) =>
                                            setJoinCode(e.currentTarget.value.toUpperCase())
                                        }
                                        placeholder={t('listenTogether.roomCodePlaceholder')}
                                        style={{ flex: 1 }}
                                        value={joinCode}
                                    />
                                    <Button
                                        disabled={joinCode.trim().length < 4}
                                        onClick={() => actions.joinRoom(joinCode)}
                                        size="compact-sm"
                                    >
                                        {t('listenTogether.join')}
                                    </Button>
                                </Group>
                            </>
                        )}
                    </Stack>
                </Popover.Dropdown>
            </Popover>

            <Modal
                handlers={{
                    close: () => actions.dismissControlRequest(),
                    open: () => {},
                    toggle: () => {},
                }}
                opened={!!pendingRequest}
                title={t('listenTogether.controlRequestTitle')}
            >
                <ConfirmModal
                    labels={{
                        cancel: t('listenTogether.cancel'),
                        confirm: t('listenTogether.giveControl'),
                    }}
                    onCancel={() => actions.dismissControlRequest()}
                    onConfirm={() => actions.approveControlRequest()}
                >
                    <Text>
                        {pendingRequest
                            ? t('listenTogether.controlRequestBody', {
                                  username: pendingRequest.username,
                              })
                            : ''}
                    </Text>
                </ConfirmModal>
            </Modal>
        </>
    );
};

interface RoomPanelProps {
    actions: ReturnType<typeof useSyncActions>;
    room: ReturnType<typeof useSyncRoom>;
}

const RoomPanel = ({ actions, room }: RoomPanelProps) => {
    const { t } = useTranslation();
    const health = useSyncHealth();
    const following = useSyncFollowing();

    const syncLabel = !following
        ? t('listenTogether.statusDetached')
        : health.syncing
          ? t('listenTogether.statusCorrecting')
          : t('listenTogether.statusInSync');
    const syncColor = !following ? 'gray' : health.syncing ? 'yellow' : 'teal';

    return (
        <Stack gap="xs">
            <Group justify="space-between">
                <Group gap="xs">
                    <Text isMuted size="sm">
                        {t('listenTogether.code')}
                    </Text>
                    <Text fw={700}>{room.roomId}</Text>
                </Group>
                <Group gap="xs">
                    <CopyButton value={room.roomId}>
                        {({ copied, copy }) => (
                            <Button onClick={copy} size="compact-xs" variant="default">
                                {copied ? t('listenTogether.copied') : t('listenTogether.copy')}
                            </Button>
                        )}
                    </CopyButton>
                    <Badge color={room.connected ? 'teal' : 'red'} variant="light">
                        {room.connected
                            ? t('listenTogether.statusLive')
                            : t('listenTogether.statusOffline')}
                    </Badge>
                </Group>
            </Group>

            <Group justify="space-between">
                <Text isMuted size="xs">
                    {t('listenTogether.clockOffset')}
                </Text>
                <Group gap="xs">
                    <Text size="xs">{formatOffset(health.clockOffsetMs)}</Text>
                    {!room.isHost && (
                        <Badge color={syncColor} size="xs" variant="light">
                            {syncLabel}
                        </Badge>
                    )}
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
                                    {isMe ? ` ${t('listenTogether.you')}` : ''}
                                </Text>
                                {isMemberHost && (
                                    <Badge color="blue" size="xs" variant="light">
                                        {t('listenTogether.hostBadge')}
                                    </Badge>
                                )}
                            </Group>
                            {room.isHost && !isMemberHost && (
                                <Tooltip label={t('listenTogether.giveControl')}>
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

            {!room.isHost && (
                <Switch
                    aria-label={t('listenTogether.followHost')}
                    checked={following}
                    label={t('listenTogether.followHost')}
                    onChange={(e) => actions.setFollowing(e.currentTarget.checked)}
                />
            )}

            <Group grow>
                {!room.isHost && (
                    <Button onClick={() => actions.requestControl()} variant="default">
                        {t('listenTogether.requestControl')}
                    </Button>
                )}
                <Button onClick={() => actions.leaveRoom()} variant="state-error">
                    {t('listenTogether.leave')}
                </Button>
            </Group>
        </Stack>
    );
};
