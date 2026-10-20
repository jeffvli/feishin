import { useState } from 'react';

import styles from './sidebar-friends.module.css';

import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { SidebarItem } from '/@/renderer/features/sidebar/components/sidebar-item';
import { type SourProfile, timeAgo } from '/@/renderer/features/sour/api/sour-api';
import { openProfile, ProfileAvatar, SongCover } from '/@/renderer/features/sour/components/people';
import { nameColor } from '/@/renderer/features/sour/components/profile-bits';
import { ProfileHover } from '/@/renderer/features/sour/components/profile-extras';
import { openSourStudio } from '/@/renderer/features/sour/components/sour-studio';
import { toggleStage } from '/@/renderer/features/sour/stage/sour-stage';
import { useSourProfiles, useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { AppRoute } from '/@/renderer/router/routes';
import { Accordion } from '/@/shared/components/accordion/accordion';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Text } from '/@/shared/components/text/text';

// Left sidebar, under the playlists: what the people you know are listening to right now
// (Spotify's friend activity). Click someone to open their profile.
export const SidebarFriends = () => {
    const url = useHermesUrl();
    const me = useSourStore((state) => state.me);
    const profiles = useSourProfiles();
    const [showOffline, setShowOffline] = useState(false);

    if (!url) return null;

    const others = (profiles.data ?? []).filter((p) => p.id !== me?.id);
    const online = others.filter((p) => p.online);
    const offline = others.filter((p) => !p.online);

    const row = (p: SourProfile) => (
        <ProfileHover key={p.id} profile={p}>
            <button
                className={p.online ? styles.row : styles.rowOffline}
                onClick={() => openProfile(p)}
                type="button"
            >
                <ProfileAvatar online={p.online} profile={p} size={32} />
                <div className={styles.text}>
                    <Text fw={600} size="sm" style={{ color: nameColor(p) }} truncate>
                        {p.name}
                    </Text>
                    {p.online && p.listening ? (
                        <>
                            <Text isMuted size="xs" truncate>
                                {p.playing ? '' : 'Paused - '}
                                {p.listening.title}
                            </Text>
                            <Text isMuted size="xs" truncate>
                                {p.tv ? `Sour Player TV - ${p.tv.event}` : p.listening.artist}
                            </Text>
                        </>
                    ) : (
                        <Text isMuted size="xs" truncate>
                            {p.online ? p.status || 'Online' : timeAgo(p.lastSeen)}
                        </Text>
                    )}
                </div>
                {p.online && p.listening && <SongCover size={34} song={p.listening} />}
            </button>
        </ProfileHover>
    );

    return (
        <Accordion.Item value="friends">
            <Accordion.Control>
                <Text fw={500} variant="secondary">
                    Friend activity
                </Text>
            </Accordion.Control>
            <Accordion.Panel>
                {online.map(row)}
                {!online.length && (
                    <Text className={styles.empty} isMuted size="xs">
                        Nobody else is listening right now.
                    </Text>
                )}
                {!!offline.length && (
                    <>
                        <button
                            className={styles.toggle}
                            onClick={() => setShowOffline((v) => !v)}
                            type="button"
                        >
                            <Icon icon={showOffline ? 'arrowDownS' : 'arrowRightS'} />
                            Offline ({offline.length})
                        </button>
                        {showOffline && offline.map(row)}
                    </>
                )}
            </Accordion.Panel>
        </Accordion.Item>
    );
};

// Left sidebar: Sour Player's own pages
export const SidebarSour = () => (
    <Accordion.Item value="sour">
        <Accordion.Control>
            <Text fw={500} variant="secondary">
                Sour
            </Text>
        </Accordion.Control>
        <Accordion.Panel>
            <SidebarItem to={AppRoute.SOUR_HUB}>
                <Group gap="md">
                    <Icon icon="partyPopper" size="lg" />
                    Sour Hub
                </Group>
            </SidebarItem>
            <SidebarItem to={AppRoute.SOUR_LIBRARY}>
                <Group gap="md">
                    <Icon icon="grid" size="lg" />
                    Sour Library
                </Group>
            </SidebarItem>
            <button className={styles.link} onClick={() => toggleStage(true)} type="button">
                <Icon icon="sparkles" size="lg" />
                Sour Stage
            </button>
            <button
                className={styles.link}
                onClick={() => window.setTimeout(openSourStudio, 320)}
                type="button"
            >
                <Icon icon="palette" size="lg" />
                Sour Studio
            </button>
        </Accordion.Panel>
    </Accordion.Item>
);
