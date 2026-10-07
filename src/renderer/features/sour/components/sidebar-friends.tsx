import { useState } from 'react';

import styles from './sidebar-friends.module.css';

import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { type SourProfile, timeAgo } from '/@/renderer/features/sour/api/sour-api';
import { openProfile, ProfileAvatar, SongCover } from '/@/renderer/features/sour/components/people';
import { useSourProfiles, useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { Accordion } from '/@/shared/components/accordion/accordion';
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
        <button
            className={p.online ? styles.row : styles.rowOffline}
            key={p.id}
            onClick={() => openProfile(p)}
            type="button"
        >
            <ProfileAvatar online={p.online} profile={p} size={32} />
            <div className={styles.text}>
                <Text fw={600} size="sm" truncate>
                    {p.name}
                </Text>
                {p.online && p.listening ? (
                    <>
                        <Text isMuted size="xs" truncate>
                            {p.playing ? '' : 'Paused - '}
                            {p.listening.title}
                        </Text>
                        <Text isMuted size="xs" truncate>
                            {p.listening.artist}
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
