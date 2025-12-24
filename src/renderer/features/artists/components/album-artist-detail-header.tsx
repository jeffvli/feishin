import { useQuery, useQueryClient } from '@tanstack/react-query';
import { forwardRef, Fragment, Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import styles from './album-artist-detail-header.module.css';

import { queryKeys } from '/@/renderer/api/query-keys';
import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import { ContextMenuController } from '/@/renderer/features/context-menu/context-menu-controller';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import {
    LibraryHeader,
    LibraryHeaderMenu,
} from '/@/renderer/features/shared/components/library-header';
import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, useGeneralSettings } from '/@/renderer/store';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { formatDurationString } from '/@/renderer/utils';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem, ServerType } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

export const AlbumArtistDetailHeader = forwardRef((_props, ref: Ref<HTMLDivElement>) => {
    const { artistRadioCount } = useGeneralSettings();
    const { albumArtistId, artistId } = useParams() as {
        albumArtistId?: string;
        artistId?: string;
    };
    const routeId = (artistId || albumArtistId) as string;
    const server = useCurrentServer();
    const { t } = useTranslation();
    const detailQuery = useQuery(
        artistsQueries.albumArtistDetail({
            query: { id: routeId },
            serverId: server?.id,
        }),
    );

    const albumCount = detailQuery?.data?.albumCount;
    const songCount = detailQuery?.data?.songCount;
    const duration = detailQuery?.data?.duration;
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

    const { addToQueueByData, addToQueueByFetch, setFavorite, setRating } = usePlayer();
    const playButtonBehavior = usePlayButtonBehavior();
    const queryClient = useQueryClient();

    const handleArtistRadio = async () => {
        if (!server?.id || !routeId) return;

        try {
            const artistRadioSongs = await queryClient.fetchQuery({
                ...songsQueries.artistRadio({
                    query: {
                        artistId: routeId,
                        count: artistRadioCount,
                    },
                    serverId: server.id,
                }),
                queryKey: queryKeys.player.fetch({ artistId: routeId }),
            });
            if (artistRadioSongs && artistRadioSongs.length > 0) {
                addToQueueByData(artistRadioSongs, Play.NOW);
            }
        } catch (error) {
            console.error('Failed to load artist radio:', error);
        }
    };

    const handlePlay = (type?: Play) => {
        if (!server?.id || !routeId) return;
        addToQueueByFetch(
            server.id,
            [routeId],
            LibraryItem.ALBUM_ARTIST,
            type || playButtonBehavior,
        );
    };

    const handleFavorite = () => {
        if (!detailQuery?.data) return;
        setFavorite(
            detailQuery.data._serverId,
            [detailQuery.data.id],
            LibraryItem.ALBUM_ARTIST,
            !detailQuery.data.userFavorite,
        );
    };

    const handleUpdateRating = (rating: number) => {
        if (!detailQuery?.data) return;

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
    };

    const handleMoreOptions = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!detailQuery?.data) return;
        ContextMenuController.call({
            cmd: { items: [detailQuery.data], type: LibraryItem.ALBUM_ARTIST },
            event: e,
        });
    };

    const showRating = detailQuery?.data?._serverType === ServerType.NAVIDROME;

    const imageUrl = useItemImageUrl({
        id: detailQuery?.data?.id,
        itemType: LibraryItem.ALBUM_ARTIST,
        type: 'itemCard',
    });

    return (
        <LibraryHeader
            imageUrl={imageUrl}
            item={{ route: AppRoute.LIBRARY_ALBUM_ARTISTS, type: LibraryItem.ALBUM_ARTIST }}
            ref={ref}
            title={detailQuery?.data?.name || ''}
        >
            <Stack gap="md" w="100%">
                <Group className={styles.metadataGroup}>
                    {metadataItems
                        .filter((i) => i.enabled)
                        .map((item, index) => (
                            <Fragment key={`item-${item.id}-${index}`}>
                                {index > 0 && <Text isNoSelect>•</Text>}
                                <Text isMuted={item.secondary}>{item.value}</Text>
                            </Fragment>
                        ))}
                </Group>
                <LibraryHeaderMenu
                    favorite={detailQuery?.data?.userFavorite}
                    onArtistRadio={handleArtistRadio}
                    onFavorite={handleFavorite}
                    onMore={handleMoreOptions}
                    onPlay={(type) => handlePlay(type)}
                    onRating={showRating ? handleUpdateRating : undefined}
                    onShuffle={() => handlePlay(Play.SHUFFLE)}
                    rating={detailQuery?.data?.userRating || 0}
                />
            </Stack>
        </LibraryHeader>
    );
});
