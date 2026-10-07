import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useSearchParams } from 'react-router';

import styles from './search-extras.module.css';

import { groupApi } from '/@/renderer/features/group-play/api/group-play-api';
import { useGroupPlayStore } from '/@/renderer/features/group-play/store/group-play.store';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { openProfile } from '/@/renderer/features/sour/components/people';
import { ProfileAvatar } from '/@/renderer/features/sour/components/profile-bits';
import { useSourProfiles, useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';

// Above the search results: people and groups that match, and "Request it" for anything missing.
export const SearchExtras = () => {
    const url = useHermesUrl();
    const me = useSourStore((state) => state.me);
    const [params] = useSearchParams();
    const query = (params.get('query') || '').trim();
    const [asked, setAsked] = useState<null | string>(null);
    const profiles = useSourProfiles().data ?? [];
    const groups = useQuery({
        enabled: !!url && !!query,
        queryFn: () => groupApi.list(url),
        queryKey: ['group-play-list', url],
    });
    if (!url || query.length < 2) return null;
    const q = query.toLowerCase();
    const people = profiles.filter((p) => p.name.toLowerCase().includes(q));
    const rooms = (groups.data ?? []).filter((g) => g.name.toLowerCase().includes(q));

    const request = async () => {
        const { userName } = useGroupPlayStore.getState();
        try {
            const res = await fetch(`${url}/api/requests`, {
                body: JSON.stringify({
                    by: userName || undefined,
                    profile: me?.id,
                    query,
                    type: 'song',
                }),
                headers: { 'content-type': 'application/json' },
                method: 'POST',
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || `Hermes Music returned ${res.status}`);
            setAsked(query);
            toast.success({ message: `Asked Hermes Music for ${query}` });
        } catch (error) {
            toast.error({ message: (error as Error).message });
        }
    };

    const join = async (code: string) => {
        const { actions, userName } = useGroupPlayStore.getState();
        try {
            const res = await groupApi.join(url, code, userName || 'Guest', me?.id ?? null);
            actions.setSession({ code, member: res.member, role: 'member' });
            actions.setState(res.state);
            useGroupPlayStore.setState({ panelOpen: true });
        } catch (error) {
            toast.error({ message: (error as Error).message });
        }
    };

    return (
        <div className={styles.strip}>
            <Group gap="xs">
                <Text size="sm">Not in the library?</Text>
                <Button
                    disabled={asked === query}
                    onClick={request}
                    size="compact-xs"
                    variant="filled"
                >
                    {asked === query ? 'Requested' : `Request "${query}" from Hermes Music`}
                </Button>
            </Group>
            {!!people.length && (
                <Group gap="xs">
                    <Text isMuted size="xs">
                        People:
                    </Text>
                    {people.slice(0, 6).map((p) => (
                        <button
                            className={styles.person}
                            key={p.id}
                            onClick={() => openProfile(p)}
                            type="button"
                        >
                            <ProfileAvatar online={p.online} profile={p} size={22} />
                            <Text size="sm">{p.name}</Text>
                        </button>
                    ))}
                </Group>
            )}
            {!!rooms.length && (
                <Group gap="xs">
                    <Text isMuted size="xs">
                        Groups:
                    </Text>
                    {rooms.slice(0, 6).map((g) => (
                        <Button
                            key={g.code}
                            onClick={() => join(g.code)}
                            size="compact-xs"
                            variant="default"
                        >
                            {g.name}
                        </Button>
                    ))}
                </Group>
            )}
        </div>
    );
};
