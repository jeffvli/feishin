import { openModal } from '@mantine/modals';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import styles from './hub.module.css';

import { api } from '/@/renderer/api';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { useMyProfile } from '/@/renderer/features/sour/store/sour.store';
import { Button } from '/@/shared/components/button/button';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { type Album } from '/@/shared/types/domain-types';

interface Found {
    artist: string;
    source: string;
    title: string;
    url: string;
}

const post = async <T,>(url: string, body: unknown): Promise<T> => {
    const res = await fetch(url, {
        body: JSON.stringify(body),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.error || `Hermes Music returned ${res.status}`);
    return json as T;
};

// Admins: search every catalogue for an album's cover (or upload a picture) and put it on the whole album
const CoverChanger = ({ album }: { album: Album }) => {
    const url = useHermesUrl();
    const queryClient = useQueryClient();
    const [q, setQ] = useState(`${album.albumArtistName || ''} ${album.name}`.trim());
    const [found, setFound] = useState<Found[] | null>(null);
    const [busy, setBusy] = useState(false);
    const [files, setFiles] = useState<string[]>([]);
    const upload = useRef<HTMLInputElement>(null);

    useEffect(() => {
        api.controller
            .getAlbumDetail({
                apiClientProps: { serverId: album._serverId },
                query: { id: album.id },
            })
            .then((a) =>
                setFiles((a?.songs ?? []).map((s) => s.path).filter((p): p is string => !!p)),
            )
            .catch(() => setFiles([]));
    }, [album]);

    const search = () => {
        setBusy(true);
        fetch(
            `${url}/api/library/covers?q=${encodeURIComponent(q)}&album=${encodeURIComponent(album.name)}`,
        )
            .then((r) => r.json())
            .then((list) => setFound(Array.isArray(list) ? list : []))
            .catch(() => setFound([]))
            .finally(() => setBusy(false));
    };
    useEffect(search, []); // eslint-disable-line react-hooks/exhaustive-deps

    const apply = (body: { image?: string; url?: string }) => {
        if (!files.length) return toast.error({ message: "Couldn't find this album's files" });
        setBusy(true);
        post<{ done: number }>(`${url}/api/library/cover`, { files, ...body })
            .then((r) => {
                toast.success({
                    message: `New cover on ${r.done} song${r.done === 1 ? '' : 's'}. Navidrome shows it after its next scan.`,
                });
                queryClient.invalidateQueries();
            })
            .catch((e: Error) => toast.error({ message: e.message }))
            .finally(() => setBusy(false));
        return undefined;
    };

    const pickFile = (file?: File) => {
        if (!file) return;
        if (file.size > 6_000_000) return toast.error({ message: 'Pick a picture under 6 MB' });
        const reader = new FileReader();
        reader.onload = () => apply({ image: String(reader.result) });
        reader.readAsDataURL(file);
        return undefined;
    };

    return (
        <Stack gap="sm">
            <Group gap="xs" wrap="nowrap">
                <TextInput
                    onChange={(e) => setQ(e.currentTarget.value)}
                    onKeyDown={(e) => e.key === 'Enter' && search()}
                    placeholder="Artist and album"
                    style={{ flex: 1 }}
                    value={q}
                />
                <Button loading={busy} onClick={search} variant="default">
                    Search
                </Button>
                <Button onClick={() => upload.current?.click()} variant="default">
                    Upload
                </Button>
                <input
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={(e) => pickFile(e.currentTarget.files?.[0])}
                    ref={upload}
                    type="file"
                />
            </Group>
            <Text isMuted size="xs">
                {files.length} song{files.length === 1 ? '' : 's'} get the cover you click. Results
                come from iTunes, Deezer and Spotify.
            </Text>
            <div className={styles['cover-grid']}>
                {(found ?? []).map((c) => (
                    <button
                        className={styles['cover-pick']}
                        disabled={busy}
                        key={c.url}
                        onClick={() => apply({ url: c.url })}
                        title={`${c.title} - ${c.artist} (${c.source})`}
                        type="button"
                    >
                        <img alt="" loading="lazy" src={c.url} />
                        <Text size="xs" truncate>
                            {c.title}
                        </Text>
                        <span className={styles.muted}>{c.source}</span>
                    </button>
                ))}
            </div>
            {found && !found.length && <Text isMuted>No covers found. Try other words.</Text>}
        </Stack>
    );
};

export const openCoverChanger = (album: Album) =>
    openModal({
        children: <CoverChanger album={album} />,
        size: 'xl',
        title: `Cover for ${album.name}`,
    });

// album right-click (admins): change the cover
export const ChangeCoverAction = ({ album }: { album?: Album }) => {
    const admin = !!useMyProfile().data?.perks?.includes('admin');
    if (!admin || !album) return null;
    return (
        <ContextMenu.Item leftIcon="image" onSelect={() => openCoverChanger(album)}>
            Change cover
        </ContextMenu.Item>
    );
};
