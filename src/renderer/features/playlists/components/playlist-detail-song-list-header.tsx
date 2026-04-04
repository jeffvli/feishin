import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'react-router';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { useListContext } from '/@/renderer/context/list-context';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { playlistsQueries } from '/@/renderer/features/playlists/api/playlists-api';
import { PlaylistDetailSongListHeaderFilters } from '/@/renderer/features/playlists/components/playlist-detail-song-list-header-filters';
import { useDeletePlaylistImage } from '/@/renderer/features/playlists/mutations/delete-playlist-image-mutation';
import { useUploadPlaylistImage } from '/@/renderer/features/playlists/mutations/upload-playlist-image-mutation';
import { FilterBar } from '/@/renderer/features/shared/components/filter-bar';
import {
    LibraryHeader,
    LibraryHeaderMenu,
} from '/@/renderer/features/shared/components/library-header';
import { LibraryHeaderBar } from '/@/renderer/features/shared/components/library-header-bar';
import { ListSearchInput } from '/@/renderer/features/shared/components/list-search-input';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { formatDurationString } from '/@/renderer/utils';
import { replaceURLWithHTMLLinks } from '/@/renderer/utils/linkify';
import { hasFeature } from '/@/shared/api/utils';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { FileButton } from '/@/shared/components/file-button/file-button';
import { Group } from '/@/shared/components/group/group';
import { Spoiler } from '/@/shared/components/spoiler/spoiler';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { useLocalStorage } from '/@/shared/hooks/use-local-storage';
import { LibraryItem, Playlist, Song } from '/@/shared/types/domain-types';
import { ServerFeature } from '/@/shared/types/features-types';
import { Play } from '/@/shared/types/types';

interface PlaylistDetailSongListHeaderProps {
    isSmartPlaylist?: boolean;
    onConvertToSmart?: () => void;
    onDelete?: () => void;
    onToggleQueryBuilder?: () => void;
}

function ImageUploadOverlay({ data }: { data?: Playlist }) {
    const uploadPlaylistImageMutation = useUploadPlaylistImage({});
    const deletePlaylistImageMutation = useDeletePlaylistImage({});
    const server = useCurrentServer();

    if (!data) return null;
    if (!hasFeature(server, ServerFeature.PLAYLIST_IMAGE_UPLOAD)) return null;

    return (
        <Group gap="xs">
            <FileButton
                accept="image/*"
                onChange={async (file) => {
                    if (!file || !data?._serverId) return;

                    const buffer = await file.arrayBuffer();
                    uploadPlaylistImageMutation.mutate({
                        apiClientProps: {
                            serverId: data._serverId,
                        },
                        body: { image: new Uint8Array(buffer) },
                        query: { id: data.id },
                    });
                }}
            >
                {(props) => (
                    <ActionIcon
                        icon="uploadImage"
                        iconProps={{ size: 'lg' }}
                        radius="xl"
                        size="xs"
                        variant="default"
                        {...props}
                    />
                )}
            </FileButton>
            <ActionIcon
                disabled={!data?.uploadedImage}
                icon="delete"
                iconProps={{ size: 'lg' }}
                onClick={(e) => {
                    e.stopPropagation();
                    if (!data?._serverId) return;
                    deletePlaylistImageMutation.mutate({
                        apiClientProps: {
                            serverId: data._serverId,
                        },
                        query: { id: data.id },
                    });
                }}
                radius="xl"
                size="xs"
                variant="default"
            />
        </Group>
    );
}

export const PlaylistDetailSongListHeader = ({
    isSmartPlaylist,
}: PlaylistDetailSongListHeaderProps) => {
    const { t } = useTranslation();
    const { playlistId } = useParams() as { playlistId: string };
    const { itemCount, listData } = useListContext();
    const server = useCurrentServer();
    const location = useLocation();

    const detailQuery = useQuery({
        ...playlistsQueries.detail({ query: { id: playlistId }, serverId: server?.id }),
        placeholderData: location.state?.item,
    });

    const playlistDuration = detailQuery?.data?.duration;
    const playlistDescription = detailQuery?.data?.description?.trim();

    const [collapsed] = useLocalStorage<boolean>({
        defaultValue: false,
        key: 'playlist-header-collapsed',
    });

    const player = usePlayer();

    const handlePlay = (type?: Play) => {
        player.addToQueueByData(listData as Song[], type || Play.NOW);
    };

    const imageUrl = useItemImageUrl({
        id: detailQuery?.data?.imageId || undefined,
        itemType: LibraryItem.PLAYLIST,
        type: 'header',
    });

    return (
        <Stack gap={0}>
            {collapsed ? (
                <PageHeader>
                    <LibraryHeaderBar ignoreMaxWidth>
                        <LibraryHeaderBar.PlayButton
                            itemType={LibraryItem.PLAYLIST}
                            songs={listData as Song[]}
                        />
                        <LibraryHeaderBar.Title>{detailQuery?.data?.name}</LibraryHeaderBar.Title>
                        {isSmartPlaylist && (
                            <LibraryHeaderBar.Badge>
                                {t('entity.smartPlaylist')}
                            </LibraryHeaderBar.Badge>
                        )}
                        {!!playlistDuration && (
                            <LibraryHeaderBar.Badge>
                                {formatDurationString(playlistDuration)}
                            </LibraryHeaderBar.Badge>
                        )}
                        <LibraryHeaderBar.Badge
                            isLoading={itemCount === null || itemCount === undefined}
                        >
                            {itemCount}
                        </LibraryHeaderBar.Badge>
                    </LibraryHeaderBar>
                    <ListSearchInput />
                </PageHeader>
            ) : (
                <LibraryHeader
                    compact
                    imageOverlay={<ImageUploadOverlay data={detailQuery?.data} />}
                    imageUrl={imageUrl}
                    item={{
                        imageId: detailQuery?.data?.imageId,
                        imageUrl: detailQuery?.data?.imageUrl,
                        route: AppRoute.PLAYLISTS,
                        type: LibraryItem.PLAYLIST,
                    }}
                    title={detailQuery?.data?.name || ''}
                    topRight={<ListSearchInput />}
                >
                    <Stack gap="md" w="100%">
                        {playlistDescription ? (
                            <Spoiler
                                hideLabel={<></>}
                                maxHeight={16}
                                showLabel={<></>}
                                style={{ marginBottom: 0 }}
                            >
                                <Text
                                    isMuted
                                    size="sm"
                                    style={{
                                        maxWidth: '100%',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    {replaceURLWithHTMLLinks(playlistDescription)}
                                </Text>
                            </Spoiler>
                        ) : null}
                        <LibraryHeaderMenu
                            onPlay={(type) => handlePlay(type)}
                            onShuffle={() => handlePlay(Play.SHUFFLE)}
                        />
                    </Stack>
                </LibraryHeader>
            )}
            <FilterBar>
                <PlaylistDetailSongListHeaderFilters isSmartPlaylist={isSmartPlaylist} />
            </FilterBar>
        </Stack>
    );
};
