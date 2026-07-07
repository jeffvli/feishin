import isElectron from 'is-electron';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '/@/renderer/api';
import { useCurrentServer } from '/@/renderer/store';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { toast } from '/@/shared/components/toast/toast';
import { LibraryItem, ServerType, Song } from '/@/shared/types/domain-types';
import { StartDownloadPayload } from '/@/shared/types/downloads';

interface DownloadActionProps {
    ids: string[];
    items?: Song[];
    itemType?: LibraryItem;
}

const downloads = isElectron() ? window.api.downloads : null;
const utils = isElectron() ? window.api.utils : null;

const serverTypeToType = (t: ServerType): StartDownloadPayload['serverType'] => {
    if (t === ServerType.JELLYFIN) return 'jellyfin';
    if (t === ServerType.NAVIDROME) return 'navidrome';
    return 'subsonic';
};

const songToPayload = (
    song: Song,
    serverId: string,
    serverType: StartDownloadPayload['serverType'],
    downloadUrl: string,
): StartDownloadPayload => ({
    downloadUrl,
    serverType,
    song: {
        _serverId: serverId,
        album: song.album ?? null,
        artistName: song.artistName ?? '',
        id: song.id,
        name: song.name,
    },
});

export const DownloadAction = ({ ids, items, itemType }: DownloadActionProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();

    const onSelect = useCallback(async () => {
        try {
            if (!server) return;

            if (isElectron() && downloads) {
                const serverType = serverTypeToType(server.type);
                const collected: Song[] = [];

                if (items && items.length > 0) {
                    collected.push(...items);
                } else if (itemType === LibraryItem.ALBUM) {
                    for (const albumId of ids) {
                        const detail = await api.controller.getAlbumDetail({
                            apiClientProps: { serverId: server.id },
                            query: { id: albumId },
                        });
                        if (detail?.songs) collected.push(...detail.songs);
                    }
                } else if (itemType === LibraryItem.PLAYLIST) {
                    for (const playlistId of ids) {
                        const list = await api.controller.getPlaylistSongList({
                            apiClientProps: { serverId: server.id },
                            query: { id: playlistId },
                        });
                        if (list?.items) collected.push(...list.items);
                    }
                } else {
                    // Fallback: treat ids as song ids with minimal metadata.
                    for (const id of ids) {
                        const downloadUrl = api.controller.getDownloadUrl({
                            apiClientProps: { serverId: server.id },
                            query: { id },
                        });
                        await downloads.enqueue([
                            {
                                downloadUrl,
                                serverType,
                                song: {
                                    _serverId: server.id,
                                    album: null,
                                    artistName: '',
                                    id,
                                    name: id,
                                },
                            },
                        ]);
                    }
                    return;
                }

                if (collected.length === 0) {
                    toast.warn({
                        message: t('common.noDownloads', {
                            defaultValue: 'Nothing to download',
                        }),
                    });
                    return;
                }

                const payloads = collected.map((song) =>
                    songToPayload(
                        song,
                        server.id,
                        serverType,
                        api.controller.getDownloadUrl({
                            apiClientProps: { serverId: server.id },
                            query: { id: song.id },
                        }),
                    ),
                );
                await downloads.enqueue(payloads);
                return;
            }

            // Web fallback — single OS download per id (album/playlist downloads as zip).
            for (const id of ids) {
                const downloadUrl = api.controller.getDownloadUrl({
                    apiClientProps: { serverId: server.id },
                    query: { id },
                });
                if (isElectron() && utils) {
                    utils.download(downloadUrl);
                } else {
                    window.open(downloadUrl, '_blank');
                }
            }
        } catch (error) {
            console.error('Failed to download items:', error);
            toast.error({
                message: (error as Error).message ?? 'Failed to start download',
            });
        }
    }, [ids, items, itemType, server, t]);

    return (
        <ContextMenu.Item leftIcon="download" onSelect={onSelect}>
            {t('page.contextMenu.download')}
        </ContextMenu.Item>
    );
};
