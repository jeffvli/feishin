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
import { useCurrentServer } from '/@/renderer/store';
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
        style={{ background: `hsl(${hue(name)} 60% 42%)` }}
        title={host ? `${name} (host)` : name}
    >
        {(name.trim()[0] || '?').toUpperCase()}
        {host && <span className={styles.crown}>&#9733;</span>}
    </span>
);

// album cover from the shared music server (each person's Feishin loads it from its own login)
const Cover = ({ className, song }: { className: string; song?: GroupSong }) => {
    const serverId = useCurrentServer()?.id;
    return (
        <div className={className}>
            {song?.imageId && serverId && (
                <ItemImage
                    className={styles.coverImage}
                    containerClassName={styles.coverImage}
                    id={song.imageId}
                    itemType={LibraryItem.SONG}
                    serverId={serverId}
                    type="table"
                />
            )}
        </div>
    );
};

const AddedBy = ({ me, name }: { me: string; name: string }) => (
    <span className={styles.addedBy}>
        <Avatar name={name} small />
        {name === me ? 'You' : name}
    </span>
);

// Group Play, like a Spotify Jam: create or join a group, see who is listening, what is playing
// and who added each song. Guests add songs and remove their own; the host can let them control
// playback.
export const GroupPlayPanel = () => {
    const url = useHermesUrl();
    const { code, hostKey, member, role, state, userName } = useGroupPlayStore();
    const actions = useGroupPlayActions();
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
        const start = () =>
            run(async () => {
                const res = await groupApi.create(url, groupName, name);
                // a group starts with an empty queue; the first song anyone adds starts it
                const player = usePlayerStoreBase.getState();
                player.mediaStop();
                player.clearQueue();
                actions.setSession({ code: res.code, hostKey: res.hostKey, role: 'host' });
                actions.setState(res.state);
            });
        const join = () =>
            run(async () => {
                const res = await groupApi.join(url, joinCode.trim(), name);
                actions.setSession({ code: joinCode.trim(), member: res.member, role: 'member' });
                actions.setState(res.state);
            });
        return (
            <Stack gap="lg">
                <div className={styles.hero}>
                    <Text className={styles.eyebrow}>Group Play</Text>
                    <Text fw={800} size="xl">
                        Listen together
                    </Text>
                    <Text size="sm">
                        Everyone hears the same song at the same moment and adds to one shared
                        queue.
                    </Text>
                </div>
                <TextInput
                    label="Your name"
                    onChange={(e) => actions.setUserName(e.currentTarget.value)}
                    placeholder="Shown to the others"
                    value={userName}
                />
                <div className={styles.choices}>
                    <div className={styles.choice}>
                        <Text fw={700}>Start a group</Text>
                        <Text isMuted size="sm">
                            You host it: your Feishin plays the music.
                        </Text>
                        <TextInput
                            onChange={(e) => setGroupName(e.currentTarget.value)}
                            placeholder="Group name (optional)"
                            value={groupName}
                        />
                        <Button disabled={busy} fullWidth onClick={start} variant="filled">
                            Start
                        </Button>
                    </div>
                    <div className={styles.choice}>
                        <Text fw={700}>Join a group</Text>
                        <Text isMuted size="sm">
                            Type the 5-letter code from the host.
                        </Text>
                        <TextInput
                            classNames={{ input: styles.codeInput }}
                            maxLength={5}
                            onChange={(e) => setJoinCode(e.currentTarget.value.toUpperCase())}
                            placeholder="ABCDE"
                            value={joinCode}
                        />
                        <Button
                            disabled={busy || joinCode.trim().length !== 5}
                            fullWidth
                            onClick={join}
                            variant="filled"
                        >
                            Join
                        </Button>
                    </div>
                </div>
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
    const status = !nowPlaying ? 'Waiting for songs' : state?.playing ? 'Now playing' : 'Paused';

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
            <div className={styles.hero}>
                <Group align="flex-start" justify="space-between" wrap="nowrap">
                    <Stack gap={6} miw={0}>
                        <Text className={styles.eyebrow}>Group Play</Text>
                        <Text fw={800} size="xl" truncate>
                            {state?.name || 'Group Play'}
                        </Text>
                        <Group gap={6}>
                            <span className={styles.avatars}>
                                <Avatar host name={hostName} />
                                {(state?.members ?? []).map((m) => (
                                    <Avatar key={m.id} name={m.name} />
                                ))}
                            </span>
                            <Text size="sm">{listening} listening</Text>
                        </Group>
                    </Stack>
                    <div className={styles.codeBox}>
                        <Text className={styles.eyebrow}>Code</Text>
                        <Text className={styles.code}>{code}</Text>
                        <CopyButton value={invite}>
                            {({ copied, copy }) => (
                                <Button onClick={copy} size="compact-xs" variant="default">
                                    {copied ? 'Copied!' : 'Copy invite'}
                                </Button>
                            )}
                        </CopyButton>
                    </div>
                </Group>
            </div>

            <div className={styles.nowPlaying}>
                <Cover className={styles.coverLarge} song={nowPlaying} />
                <Stack flex={1} gap={4} miw={0}>
                    <Text className={styles.eyebrow}>
                        {status}
                    </Text>
                    {nowPlaying ? (
                        <>
                            <Text fw={700} size="lg" truncate>
                                {nowPlaying.title}
                            </Text>
                            <Text isMuted size="sm" truncate>
                                {nowPlaying.artist}
                                {nowPlaying.album ? ` - ${nowPlaying.album}` : ''}
                            </Text>
                            <AddedBy me={me} name={nowPlaying.by || hostName} />
                        </>
                    ) : (
                        <Text isMuted size="sm">
                            Right-click any song &gt; Add to group queue. The first song added
                            starts playing for everyone.
                        </Text>
                    )}
                </Stack>
                {canControl && nowPlaying && (
                    <Group gap={4} wrap="nowrap">
                        <ActionIcon
                            icon="mediaPrevious"
                            onClick={() => control('previous')}
                            tooltip={{ label: 'Previous' }}
                            variant="subtle"
                        />
                        <ActionIcon
                            icon={state?.playing ? 'mediaPause' : 'mediaPlay'}
                            onClick={() => control(state?.playing ? 'pause' : 'play')}
                            size="xl"
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

            <Stack gap={8}>
                <Group justify="space-between">
                    <Text fw={700}>Up next</Text>
                    <Text isMuted size="sm">
                        {upNext.length} {upNext.length === 1 ? 'song' : 'songs'}
                    </Text>
                </Group>
                <div className={styles.queue}>
                    {upNext.map(({ at, song }) => (
                        <div className={styles.row} key={`${song.id}-${at}`}>
                            <Cover className={styles.coverSmall} song={song} />
                            <div className={styles.songText}>
                                <Text fw={600} size="sm" truncate>
                                    {song.title}
                                </Text>
                                <Text isMuted size="xs" truncate>
                                    {song.artist}
                                </Text>
                            </div>
                            <AddedBy me={me} name={song.by || hostName} />
                            <span className={styles.rowActions}>
                                {canControl && (
                                    <ActionIcon
                                        icon="mediaPlay"
                                        onClick={() => control('playIndex', at, song)}
                                        size="sm"
                                        tooltip={{ label: 'Play now' }}
                                        variant="subtle"
                                    />
                                )}
                                {canControl && (
                                    <ActionIcon
                                        icon="mediaPlayNext"
                                        onClick={() => control('playNext', at, song)}
                                        size="sm"
                                        tooltip={{ label: 'Play next' }}
                                        variant="subtle"
                                    />
                                )}
                                {(canControl || (song.by || hostName) === me) && (
                                    <ActionIcon
                                        icon="x"
                                        onClick={() => control('remove', at, song)}
                                        size="sm"
                                        tooltip={{ label: 'Remove' }}
                                        variant="subtle"
                                    />
                                )}
                            </span>
                        </div>
                    ))}
                    {!upNext.length && (
                        <Text className={styles.empty} isMuted size="sm">
                            Nothing up next. Right-click any song &gt; Add to group queue.
                        </Text>
                    )}
                </div>
            </Stack>

            {isHost && (
                <div className={styles.settings}>
                    <Switch
                        checked={!!state?.guestControl}
                        description="Guests can play, pause, skip, reorder and remove any song. They can always add songs and remove their own."
                        label="Let guests control playback"
                        onChange={(e) => setGuestControl(e.currentTarget.checked)}
                    />
                    {!!state?.members.length && (
                        <Group gap="xs">
                            {state.members.map((m) => (
                                <span className={styles.person} key={m.id}>
                                    <Avatar name={m.name} small />
                                    {m.name}
                                    <ActionIcon
                                        icon="x"
                                        onClick={() => kick(m.id)}
                                        size="xs"
                                        tooltip={{ label: `Remove ${m.name} from the group` }}
                                        variant="subtle"
                                    />
                                </span>
                            ))}
                        </Group>
                    )}
                </div>
            )}
            {!isHost && !state?.guestControl && (
                <Text isMuted size="xs">
                    The host controls playback. You can add songs and remove the ones you added.
                </Text>
            )}

            <Group justify="flex-end">
                <Button color="red" disabled={busy} onClick={leave} variant="light">
                    {isHost ? 'End group' : 'Leave group'}
                </Button>
            </Group>
        </Stack>
    );
};
