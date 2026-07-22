import { ContextModalProps } from '@mantine/modals';
import { useEffect, useState } from 'react';

import { controller } from '/@/renderer/api/controller';
import { SongEditModal } from '/@/renderer/features/tag-editor/components/song-edit-modal';
import { useCurrentServer } from '/@/renderer/store';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { Song } from '/@/shared/types/domain-types';

type SongEditInnerProps = {
    albumIds?: string[];
    songs?: Song[];
};

export const SongEditContextModal = ({ innerProps }: ContextModalProps<SongEditInnerProps>) => {
    const server = useCurrentServer();
    const [resolvedSongs, setResolvedSongs] = useState<null | Song[]>(null);

    useEffect(() => {
        if (innerProps.albumIds) {
            if (!server?.id) {
                setResolvedSongs([]);
                return;
            }
            Promise.all(
                innerProps.albumIds.map((id) =>
                    controller.getAlbumDetail({
                        apiClientProps: { serverId: server.id },
                        query: { id },
                    }),
                ),
            ).then((albums) => {
                setResolvedSongs(
                    albums.flatMap((album) => album?.songs ?? []).filter((s) => s.path),
                );
            });
        } else {
            setResolvedSongs((innerProps.songs ?? []).filter((s) => s.path));
        }
    }, [innerProps.albumIds, innerProps.songs, server?.id]);

    if (resolvedSongs === null) {
        return (
            <Stack align="center" p="xl">
                <Spinner />
            </Stack>
        );
    }

    return <SongEditModal songs={resolvedSongs} />;
};
