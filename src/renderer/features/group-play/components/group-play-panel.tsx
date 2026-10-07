import { closeAllModals } from '@mantine/modals';
import { useState } from 'react';

import styles from './group-play-panel.module.css';

import { ItemImage } from '/@/renderer/components/item-image/item-image';
import { groupApi } from '/@/renderer/features/group-play/api/group-play-api';
import {
    type GroupControl,
    type GroupSong,
    useGroupPlayActions,
    useGroupPlayStore,
} from '/@/renderer/features/group-play/store/group-play.store';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { usePlayerSong } from '/@/renderer/store';
import { usePlayerStoreBase } from '/@/renderer/store/player.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { CopyButton } from '/@/shared/components/copy-button/copy-button';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { LibraryItem } from '/@/shared/types/domain-types';

// the same colour for the same name, on every computer
const hue = (name: string) =>
    [...name].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 360, 7);

const Avatar = ({ host, name, small }: { host?: boolean; name: string; small?: boolean }) => (
    <span
        className={small ? styles.avatarSmall : styles.avatar}
        style={{ background: `hsl(${hue(name)} 55% 45%)` }}
        title={host ? `${name} (host)` : name}
    >
        {(name.trim()[0] || '?').toUpperCase()}
        {host && <span className={styles.crown}>&#9733;</span>}
    </span>
);

// Group Play, like a Spotify Jam: create or join a group, see who is listening, what is playing and
// who added each song. Guests add songs and remove their own; the host can let them control playback.
export const GroupPlayPanel = () => {
    const url = useHermesUrl();
    const { code, hostKey, member, role, state, userName } = useGroupPlayStore();
    const actions = useGroupPlayActions();
    const current = usePlayerSong();
    const [joinCode, setJoinCode] = useState('');
    const [groupName, setGroupName] = useState('');
    const [busy, setBusy] = useState(false);

    if (!url) {
        return (
            <Text isMuted>
                Group Play runs through Hermes Music. Add its address in Settings &gt; General &gt;
                Music videos first.
            </Text>
        );
    }

    const run = async (work: () => Promise<void>) => {
        setBusy(true);
        try {
            await work();
        } catch (error) {
            toast.error({ message: (error as Error).message });
        } finally {
            setBusy(false);
        }
    };

    if (!code) {
        const name = userName.trim() || 'Guest';
        return (
            <Stack gap="lg">
                <TextInput
                    label="Your name"
                    onChange={(e) => actions.setUserName(e.currentTarget.value)}
                    placeholder="Shown to the others"
                    value={userName}
                />
                <Stack gap="xs">
                    <Text fw={600}>Start a group</Text>
                    <Text isMuted size="sm">
                        Everyone listens to the same song at the same time and adds to one shared
                        queue. Your Feishin plays the music.
                    </Text>
                    <Group gap="xs" wrap="nowrap">
                        <TextInput
                            flex={1}
                            onChange={(e) => setGroupName(e.currentTarget.value)}
                            placeholder="Group name (optional)"
                            value={groupName}
                        />
                        <Button
                            disabled={busy}
                            onClick={() =>
                                run(async () => {
                                    const res = await groupApi.create(url, groupName, name);
                                    actions.setSession({
                                        code: res.code,
                                        hostKey: res.hostKey,
                                        role: 'host',
                                    });
                                    actions.setState(res.state);
                                })
                            }
                            variant="filled"
                        >
                            Start
                        </Button>
                    </Group>
                </Stack>
                <Stack gap="xs">
                    <Text fw={600}>Join a group</Text>
                    <Text isMuted size="sm">
                        Type the 5-letter code from the host.
                    </Text>
                    <Group gap="xs" wrap="nowrap">
                        <TextInput
                            flex={1}
                            onChange={(e) => setJoinCode(e.currentTarget.value.toUpperCase())}
                            placeholder="Group code"
                            value={joinCode}
                        />
                        <Button
                            disabled={busy || joinCode.trim().length !== 5}
                            onClick={() =>
                                run(async () => {
                                    const res = await groupApi.join(url, joinCode.trim(), name);
                                    actions.setSession({
                                        code: joinCode.trim(),
                                        member: res.member,
                                        role: 'member',
                                    });
                                    actions.setState(res.state);
                                })
                            }
                            variant="filled"
                        >
                            Join
                        </Button>
                    </Group>
                </Stack>
            </Stack>
        );
    }

    const isHost = role === 'host';
    const hostName = state?.host ?? 'Host';
    const me = isHost ? hostName : userName.trim() || 'Guest';
    const canControl = isHost || !!state?.guestControl;
    const queue = state?.queue ?? [];
    const index = state?.index ?? 0;
    const nowPlaying = queue[index];
    const upNext = queue.slice(index + 1).map((song, i) => ({ at: index + 1 + i, song }));
    const listening = (state?.members.length ?? 0) + 1;
    const showCover = !!current && !!nowPlaying && current.id === nowPlaying.id;

    // the host's own controls act on its player right away; guests' go through Hermes Music
    const control = (cmd: GroupControl, at = -1, song?: GroupSong) => {
        if (isHost) {
            const player = usePlayerStoreBase.getState();
            const item = player.getQueue().items[at];
            if (cmd === 'play') player.mediaPlay();
            if (cmd === 'pause') player.mediaPause();
            if (cmd === 'next') player.mediaNext(false);
            if (cmd === 'previous') player.mediaPrevious(false);
            if (item && cmd === 'playIndex') player.mediaPlayByIndex(at);
            if (item && cmd === 'playNext') player.moveSelectedToNext([item]);
            if (item && cmd === 'remove') player.clearSelected([item]);
            return;
        }
        if (!member) return;
        groupApi
            .control(url, code, member, cmd, { index: at, songId: song?.id })
            .catch((error: Error) => toast.error({ message: error.message }));
    };

    const kick = (target: string) => {
        if (!hostKey) return;
        groupApi
            .kick(url, code, hostKey, target)
            .catch((error: Error) => toast.error({ message: error.message }));
    };

    const setGuestControl = (on: boolean) => {
        if (!hostKey) return;
        groupApi
            .settings(url, code, hostKey, on)
            .catch((error: Error) => toast.error({ message: error.message }));
    };

    const leave = () =>
        run(async () => {
            if (isHost && hostKey) await groupApi.end(url, code, hostKey).catch(() => {});
            if (!isHost && member) await groupApi.leave(url, code, member).catch(() => {});
            actions.leave();
            closeAllModals();
        });

    const invite = `Join my Group Play in Feishin: people icon in the player bar > Join > code ${code}`;

    return (
        <Stack gap="md">
            <Group justify="space-between" wrap="nowrap">
                <Stack gap={4}>
                    <Text fw={700} size="lg">
                        {state?.name || 'Group Play'}
                    </Text>
                    <Group gap={4}>
                        <Avatar host name={hostName} />
                        {(state?.members ?? []).map((m) => (
                            <Avatar key={m.id} name={m.name} />
                        ))}
                        <Text isMuted ml={6} size="sm">
                            {listening} listening
                        </Text>
                    </Group>
                </Stack>
                <Stack align="flex-end" gap={4}>
                    <Text className={styles.code}>{code}</Text>
                    <CopyButton value={invite}>
                        {({ copied, copy }) => (
                            <Button onClick={copy} size="compact-xs" variant="default">
                                {copied ? 'Copied' : 'Copy invite'}
                            </Button>
                        )}
                    </CopyButton>
                </Stack>
            </Group>

            <div className={styles.nowPlaying}>
                {showCover ? (
                    <ItemImage
                        className={styles.cover}
                        id={current.imageId}
                        itemType={LibraryItem.SONG}
                        serverId={current._serverId}
                        type="table"
                    />
                ) : (
                    <div className={styles.cover} />
                )}
                <Stack flex={1} gap={2} miw={0}>
                    <Text isMuted size="xs">
                        {state?.playing ? 'NOW PLAYING' : 'PAUSED'}
                    </Text>
                    <Text fw={600} truncate>
                        {nowPlaying ? nowPlaying.title : 'Nothing playing yet'}
                    </Text>
                    {nowPlaying && (
                        <Group gap={6} wrap="nowrap">
                            <Avatar name={nowPlaying.by || hostName} small />
                            <Text isMuted size="sm" truncate>
                                {nowPlaying.artist}
                            </Text>
                        </Group>
                    )}
                </Stack>
                {canControl && (
                    <Group gap={2} wrap="nowrap">
                        <ActionIcon
                            icon="mediaPrevious"
                            onClick={() => control('previous')}
                            tooltip={{ label: 'Previous' }}
                            variant="subtle"
                        />
                        <ActionIcon
                            icon={state?.playing ? 'mediaPause' : 'mediaPlay'}
                            onClick={() => control(state?.playing ? 'pause' : 'play')}
                            size="lg"
                            tooltip={{ label: state?.playing ? 'Pause' : 'Play' }}
                            variant="filled"
                        />
                        <ActionIcon
                            icon="mediaNext"
                            onClick={() => control('next')}
                            tooltip={{ label: 'Skip' }}
                            variant="subtle"
                        />
                    </Group>
                )}
            </div>

            <Stack gap={6}>
                <Text fw={600} size="sm">
                    Up next
                </Text>
                <div className={styles.queue}>
                    {upNext.map(({ at, song }) => (
                        <div className={styles.row} key={`${song.id}-${at}`}>
                            <Avatar name={song.by || hostName} small />
                            <span className={styles.title}>
                                {song.title}
                                <span className={styles.artist}> - {song.artist}</span>
                            </span>
                            <span className={styles.rowActions}>
                                {canControl && (
                                    <ActionIcon
                                        icon="mediaPlay"
                                        onClick={() => control('playIndex', at, song)}
                                        size="xs"
                                        tooltip={{ label: 'Play now' }}
                                        variant="subtle"
                                    />
                                )}
                                {canControl && (
                                    <ActionIcon
                                        icon="mediaPlayNext"
                                        onClick={() => control('playNext', at, song)}
                                        size="xs"
                                        tooltip={{ label: 'Play next' }}
                                        variant="subtle"
                                    />
                                )}
                                {(canControl || (song.by || hostName) === me) && (
                                    <ActionIcon
                                        icon="x"
                                        onClick={() => control('remove', at, song)}
                                        size="xs"
                                        tooltip={{ label: 'Remove' }}
                                        variant="subtle"
                                    />
                                )}
                            </span>
                        </div>
                    ))}
                    {!upNext.length && (
                        <Text isMuted p="sm" size="sm">
                            Nothing queued. Right-click any song &gt; Add to group queue.
                        </Text>
                    )}
                </div>
            </Stack>

            {isHost && (
                <Stack gap="xs">
                    <Switch
                        checked={!!state?.guestControl}
                        description="Guests can play, pause, skip, reorder and remove any song. They can always add songs and remove their own."
                        label="Let guests control playback"
                        onChange={(e) => setGuestControl(e.currentTarget.checked)}
                    />
                    {!!state?.members.length && (
                        <Group gap="xs">
                            <Text isMuted size="xs">
                                Remove:
                            </Text>
                            {state.members.map((m) => (
                                <Button
                                    key={m.id}
                                    onClick={() => kick(m.id)}
                                    size="compact-xs"
                                    variant="default"
                                >
                                    {m.name}
                                </Button>
                            ))}
                        </Group>
                    )}
                </Stack>
            )}
            {!isHost && !state?.guestControl && (
                <Text isMuted size="xs">
                    The host controls playback. You can add songs and remove the ones you added.
                </Text>
            )}

            <Group justify="flex-end">
                <Button color="red" disabled={busy} onClick={leave} variant="subtle">
                    {isHost ? 'End group' : 'Leave group'}
                </Button>
            </Group>
        </Stack>
    );
};
