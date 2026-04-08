import { useSuspenseQuery, UseSuspenseQueryResult } from '@tanstack/react-query';
import { forwardRef, Fragment, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import styles from './album-artist-detail-header.module.css';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import { getArtistAlbumsGrouped } from '/@/renderer/features/artists/hooks/use-artist-albums-grouped';
import { useDeleteArtistImage } from '/@/renderer/features/artists/mutations/delete-artist-image-mutation';
import { useUploadArtistImage } from '/@/renderer/features/artists/mutations/upload-artist-image-mutation';
import { ContextMenuController } from '/@/renderer/features/context-menu/context-menu-controller';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import {
    LibraryHeader,
    LibraryHeaderMenu,
} from '/@/renderer/features/shared/components/library-header';
import { useSetFavorite } from '/@/renderer/features/shared/hooks/use-set-favorite';
import { useSetRating } from '/@/renderer/features/shared/hooks/use-set-rating';
import { AppRoute } from '/@/renderer/router/routes';
import { useAppStore, useCurrentServer, useShowRatings } from '/@/renderer/store';
import { useArtistReleaseTypeItems, usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { formatDurationString } from '/@/renderer/utils';
import { hasFeature, SEPARATOR_STRING, sortAlbumList } from '/@/shared/api/utils';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { FileButton } from '/@/shared/components/file-button/file-button';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import {
    AlbumArtistDetailResponse,
    AlbumListResponse,
    LibraryItem,
    ServerType,
} from '/@/shared/types/domain-types';
import { ServerFeature } from '/@/shared/types/features-types';
import { Play } from '/@/shared/types/types';

interface AlbumArtistDetailHeaderProps {
    albumsQuery: UseSuspenseQueryResult<AlbumListResponse, Error>;
}

function ArtistImageUploadOverlay({
    data,
    onUploadFile,
}: {
    data?: AlbumArtistDetailResponse;
    onUploadFile: (file: File) => Promise<void>;
}) {
    const deleteArtistImageMutation = useDeleteArtistImage({});
    const server = useCurrentServer();

    if (!data) return null;
    if (!hasFeature(server, ServerFeature.ARTIST_IMAGE_UPLOAD)) return null;

    return (
        <Group gap="xs">
            <FileButton
                accept="image/*"
                onChange={async (file) => {
                    if (!file) return;
                    await onUploadFile(file);
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
                    deleteArtistImageMutation.mutate({
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

export const AlbumArtistDetailHeader = forwardRef<HTMLDivElement, AlbumArtistDetailHeaderProps>(
    ({ albumsQuery }, ref) => {
        const { albumArtistId, artistId } = useParams() as {
            albumArtistId?: string;
            artistId?: string;
        };
        const routeId = (artistId || albumArtistId) as string;
        const server = useCurrentServer();
        const showRatings = useShowRatings();
        const { t } = useTranslation();
        const detailQuery = useSuspenseQuery(
            artistsQueries.albumArtistDetail({
                query: { id: routeId },
                serverId: server?.id,
            }),
        );

        const albumCount = detailQuery.data?.albumCount;
        const songCount = detailQuery.data?.songCount;
        const duration = detailQuery.data?.duration;
        const durationEnabled = duration !== null && duration !== undefined;

        const metadataItems = [
            {
                enabled: albumCount !== null && albumCount !== undefined,
                id: 'albumCount',
                secondary: false,
                value: t('entity.albumWithCount', { count: albumCount || 0 }),
            },
            {
                enabled: songCount !== null && songCount !== undefined,
                id: 'songCount',
                secondary: false,
                value: t('entity.trackWithCount', { count: songCount || 0 }),
            },
            {
                enabled: durationEnabled,
                id: 'duration',
                secondary: true,
                value: durationEnabled && formatDurationString(duration),
            },
        ];

        const { addToQueueByFetch } = usePlayer();
        const playButtonBehavior = usePlayButtonBehavior();
        const setFavorite = useSetFavorite();
        const setRating = useSetRating();
        const uploadArtistImageMutation = useUploadArtistImage({});

        const albumArtistDetailSort = useAppStore((state) => state.albumArtistDetailSort);
        const sortBy = albumArtistDetailSort.sortBy;
        const sortOrder = albumArtistDetailSort.sortOrder;
        const groupingType = albumArtistDetailSort.groupingType;
        const artistReleaseTypeItems = useArtistReleaseTypeItems();

        const handlePlay = useCallback(
            (type?: Play) => {
                if (!server?.id || !routeId) return;

                const albums = albumsQuery.data?.items || [];
                const sortedAlbums = sortAlbumList(albums, sortBy, sortOrder);

                const { flatSortedAlbums } = getArtistAlbumsGrouped(
                    sortedAlbums,
                    routeId,
                    groupingType,
                    artistReleaseTypeItems,
                    t,
                );

                const albumIds = flatSortedAlbums.map((album) => album.id);
                if (albumIds.length === 0) return;
                addToQueueByFetch(
                    server.id,
                    albumIds,
                    LibraryItem.ALBUM,
                    type || playButtonBehavior,
                );
            },
            [
                addToQueueByFetch,
                playButtonBehavior,
                routeId,
                server.id,
                albumsQuery.data?.items,
                sortBy,
                sortOrder,
                groupingType,
                artistReleaseTypeItems,
                t,
            ],
        );

        const handleFavorite = useCallback(() => {
            if (!detailQuery.data) return;
            setFavorite(
                detailQuery.data._serverId,
                [detailQuery.data.id],
                LibraryItem.ALBUM_ARTIST,
                !detailQuery.data.userFavorite,
            );
        }, [detailQuery.data, setFavorite]);

        const handleUpdateRating = useCallback(
            (rating: number) => {
                if (!detailQuery.data) return;

                if (detailQuery.data.userRating === rating) {
                    return setRating(
                        detailQuery.data._serverId,
                        [detailQuery.data.id],
                        LibraryItem.ALBUM_ARTIST,
                        0,
                    );
                }

                return setRating(
                    detailQuery.data._serverId,
                    [detailQuery.data.id],
                    LibraryItem.ALBUM_ARTIST,
                    rating,
                );
            },
            [detailQuery.data, setRating],
        );

        const handleMoreOptions = useCallback(
            (e: React.MouseEvent<HTMLButtonElement>) => {
                if (!detailQuery.data) return;
                ContextMenuController.call({
                    cmd: { items: [detailQuery.data], type: LibraryItem.ALBUM_ARTIST },
                    event: e,
                });
            },
            [detailQuery.data],
        );

        const headerImageUrl = useItemImageUrl({
            id: detailQuery.data?.imageId || undefined,
            imageUrl: detailQuery.data?.imageUrl,
            itemType: LibraryItem.ALBUM_ARTIST,
            type: 'header',
        });

        const showRating = showRatings && detailQuery?.data?._serverType === ServerType.NAVIDROME;

        const canUploadArtistImage =
            hasFeature(server, ServerFeature.ARTIST_IMAGE_UPLOAD) &&
            Boolean(detailQuery.data?._serverId);

        const handleArtistImageUpload = useCallback(
            async (file: File) => {
                const artist = detailQuery.data;
                if (!artist?._serverId) return;

                const buffer = await file.arrayBuffer();
                uploadArtistImageMutation.mutate({
                    apiClientProps: {
                        serverId: artist._serverId,
                    },
                    body: { image: new Uint8Array(buffer) },
                    query: { id: artist.id },
                });
            },
            [detailQuery.data, uploadArtistImageMutation],
        );

        return (
            <LibraryHeader
                imageOverlay={
                    <ArtistImageUploadOverlay
                        data={detailQuery.data}
                        onUploadFile={handleArtistImageUpload}
                    />
                }
                imageUrl={headerImageUrl}
                item={{
                    imageId: detailQuery.data?.imageId,
                    imageUrl: detailQuery.data?.imageUrl,
                    route: AppRoute.LIBRARY_ALBUM_ARTISTS,
                    type: LibraryItem.ALBUM_ARTIST,
                }}
                onImageFileDrop={canUploadArtistImage ? handleArtistImageUpload : undefined}
                ref={ref}
                title={detailQuery.data?.name || ''}
            >
                <Stack gap="md" w="100%">
                    <Group className={styles.metadataGroup}>
                        {metadataItems
                            .filter((i) => i.enabled)
                            .map((item, index) => (
                                <Fragment key={`item-${item.id}-${index}`}>
                                    {index > 0 && (
                                        <Text isMuted isNoSelect>
                                            {SEPARATOR_STRING}
                                        </Text>
                                    )}
                                    <Text isMuted={item.secondary}>{item.value}</Text>
                                </Fragment>
                            ))}
                    </Group>
                    <LibraryHeaderMenu
                        favorite={detailQuery.data?.userFavorite}
                        onFavorite={handleFavorite}
                        onMore={handleMoreOptions}
                        onPlay={(type) => handlePlay(type)}
                        onRating={showRating ? handleUpdateRating : undefined}
                        onShuffle={() => handlePlay(Play.SHUFFLE)}
                        rating={detailQuery.data?.userRating || 0}
                    />
                </Stack>
            </LibraryHeader>
        );
    },
);
