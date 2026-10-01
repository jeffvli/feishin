import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { generatePath } from 'react-router';

import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { ContextMenuController } from '/@/renderer/features/context-menu/context-menu-controller';
import { OfflineStatusIcon } from '/@/renderer/features/offline/components/offline-status-icon';
import { sharedQueries } from '/@/renderer/features/shared/api/shared-api';
import { SidebarItem } from '/@/renderer/features/sidebar/components/sidebar-item';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, useCurrentServerId, usePlayerSong } from '/@/renderer/store';
import { Accordion } from '/@/shared/components/accordion/accordion';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Text } from '/@/shared/components/text/text';
import { AlbumListSort, LibraryItem, SortOrder } from '/@/shared/types/domain-types';

const SIDEBAR_ALBUM_LIMIT = 10;

export const SidebarAlbumList = () => {
    const { t } = useTranslation();
    const currentServer = useCurrentServer();
    const serverId = useCurrentServerId();
    const currentSong = usePlayerSong();
    const musicFoldersQuery = useQuery(sharedQueries.musicFolders({ query: null, serverId }));
    const albumsQuery = useQuery(
        albumQueries.list({
            query: {
                limit: SIDEBAR_ALBUM_LIMIT,
                sortBy: AlbumListSort.NAME,
                sortOrder: SortOrder.ASC,
                startIndex: 0,
            },
            serverId,
        }),
    );
    const selectedMusicFolders = musicFoldersQuery.data?.items.filter((folder) =>
        currentServer.musicFolderId?.includes(folder.id),
    );
    const sectionTitle =
        selectedMusicFolders?.length === 1
            ? selectedMusicFolders[0].name
            : t('page.sidebar.albums');

    if (!albumsQuery.data?.items.length) {
        return null;
    }

    return (
        <Accordion.Item value="albums">
            <Accordion.Control component="div" role="button" style={{ userSelect: 'none' }}>
                <Text fw={500}>{sectionTitle}</Text>
            </Accordion.Control>
            <Accordion.Panel>
                {albumsQuery.data.items.map((album) => {
                    const isCurrentAlbum =
                        currentSong?._serverId === serverId && currentSong.albumId === album.id;

                    return (
                        <SidebarItem
                            key={album.id}
                            onContextMenu={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                ContextMenuController.call({
                                    cmd: {
                                        compact: true,
                                        items: [album],
                                        type: LibraryItem.ALBUM,
                                    },
                                    event,
                                });
                            }}
                            to={generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, { albumId: album.id })}
                        >
                            <Group gap="md" wrap="nowrap">
                                <Icon icon="album" size="1rem" />
                                <Text overflow="hidden">{album.name}</Text>
                                {isCurrentAlbum && (
                                    <span aria-label={t('page.sidebar.nowPlaying')} role="img">
                                        <Icon color="primary" icon="mediaPlay" size="sm" />
                                    </span>
                                )}
                                <OfflineStatusIcon item={album} itemType={LibraryItem.ALBUM} />
                            </Group>
                        </SidebarItem>
                    );
                })}
            </Accordion.Panel>
        </Accordion.Item>
    );
};
