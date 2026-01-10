import { useQuery } from '@tanstack/react-query';
import { forwardRef, Fragment, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';

import styles from './album-detail-header.module.css';

import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { JoinedArtists } from '/@/renderer/features/albums/components/joined-artists';
import { ContextMenuController } from '/@/renderer/features/context-menu/context-menu-controller';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import {
    LibraryHeader,
    LibraryHeaderMenu,
} from '/@/renderer/features/shared/components/library-header';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, useShowRatings } from '/@/renderer/store';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { formatDateAbsoluteUTC, formatDurationString } from '/@/renderer/utils';
import { normalizeReleaseTypes } from '/@/renderer/utils/normalize-release-types';
import { Group } from '/@/shared/components/group/group';
import { Separator } from '/@/shared/components/separator/separator';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem, ServerType } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

export const AlbumDetailHeader = forwardRef<HTMLDivElement>((_props, ref) => {
    const { albumId } = useParams() as { albumId: string };
    const { t } = useTranslation();
    const server = useCurrentServer();
    const showRatings = useShowRatings();
    const detailQuery = useQuery(
        albumQueries.detail({ query: { id: albumId }, serverId: server?.id }),
    );

    const showRating =
        showRatings &&
        (detailQuery?.data?._serverType === ServerType.NAVIDROME ||
            detailQuery?.data?._serverType === ServerType.SUBSONIC);

    const { addToQueueByFetch, setFavorite, setRating } = usePlayer();
    const playButtonBehavior = usePlayButtonBehavior();

    const handleFavorite = () => {
        if (!detailQuery?.data) return;
        setFavorite(
            detailQuery.data._serverId,
            [detailQuery.data.id],
            LibraryItem.ALBUM,
            !detailQuery.data.userFavorite,
        );
    };

    const handleUpdateRating = showRating
        ? (rating: number) => {
              if (!detailQuery?.data) return;

              if (detailQuery.data.userRating === rating) {
                  return setRating(
                      detailQuery.data._serverId,
                      [detailQuery.data.id],
                      LibraryItem.ALBUM,
                      0,
                  );
              }

              return setRating(
                  detailQuery.data._serverId,
                  [detailQuery.data.id],
                  LibraryItem.ALBUM,
                  rating,
              );
          }
        : undefined;

    const handlePlay = (type?: Play) => {
        if (!server?.id || !albumId) return;
        addToQueueByFetch(server.id, [albumId], LibraryItem.ALBUM, type || playButtonBehavior);
    };

    const handleMoreOptions = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!detailQuery?.data) return;
        ContextMenuController.call({
            cmd: { items: [detailQuery.data], type: LibraryItem.ALBUM },
            event: e,
        });
    };

    const releaseYear = detailQuery?.data?.releaseYear;
    const releaseDate = detailQuery?.data?.releaseDate;

    const metadataItems = useMemo(() => {
        const items: Array<{ id: string; value: React.ReactNode | string | undefined }> = [];

        const album = detailQuery?.data;

        if (!album) return [];

        const originalDifferentFromRelease =
            album?.originalDate && album?.originalDate !== album?.releaseDate;

        const originalYearDifferentFromRelease = album?.originalYear !== album?.releaseYear;

        const playCount = album?.playCount;

        const releasePrefix = originalDifferentFromRelease
            ? t('page.albumDetail.released', { postProcess: 'sentenceCase' })
            : '♫';

        const releaseYearPrefix = originalYearDifferentFromRelease
            ? t('page.albumDetail.released', { postProcess: 'sentenceCase' })
            : '♫';

        if (album.originalDate) {
            if (originalDifferentFromRelease) {
                items.push({
                    id: 'originalDate',
                    value: `♫ ${formatDateAbsoluteUTC(album.originalDate)}`,
                });
            }

            if (releaseDate) {
                items.push({
                    id: 'releaseDate',
                    value: `${releasePrefix} ${formatDateAbsoluteUTC(releaseDate)}`,
                });
            }
        } else if (album.originalYear) {
            if (originalYearDifferentFromRelease) {
                items.push({
                    id: 'originalYear',
                    value: `♫ ${album.originalYear}`,
                });
            }

            if (releaseDate) {
                items.push({
                    id: 'releaseDate',
                    value: `${releaseYearPrefix} ${formatDateAbsoluteUTC(releaseDate)}`,
                });
            } else if (releaseYear) {
                items.push({
                    id: 'releaseYear',
                    value: `${releaseYearPrefix} ${releaseYear}`,
                });
            }
        }

        items.push(
            ...[
                {
                    id: 'songCount',
                    value: t('entity.trackWithCount', { count: detailQuery?.data?.songCount || 0 }),
                },
                {
                    id: 'duration',
                    value: formatDurationString(detailQuery?.data?.duration || 0),
                },
                {
                    id: 'explicitStatus',
                    value: detailQuery?.data?.explicitStatus,
                },
                {
                    id: 'playCount',
                    value: playCount ? t('entity.play', { count: playCount }) : undefined,
                },
            ],
        );

        return items.filter((item) => !!item.value);
    }, [detailQuery?.data, releaseDate, releaseYear, t]);

    const headerItem = useMemo(() => {
        const album = detailQuery?.data;

        if (!album) return null;

        const releaseTypes = album.releaseType
            ? normalizeReleaseTypes([album.releaseType], t)
            : null;

        const releaseTypeText = releaseTypes?.length ? releaseTypes[0] : null;

        if (releaseTypeText) {
            return (
                <Group gap="sm">
                    <Text
                        component={Link}
                        fw={600}
                        isLink
                        size="md"
                        to={AppRoute.LIBRARY_ALBUMS}
                        tt="uppercase"
                    >
                        {releaseTypeText}
                    </Text>
                    {album.version && (
                        <>
                            <Text fw={600} isMuted>
                                <Separator />
                            </Text>
                            <Text>{album.version}</Text>
                        </>
                    )}
                </Group>
            );
        }

        return null;
    }, [detailQuery?.data, t]);

    return (
        <Stack ref={ref}>
            <LibraryHeader
                item={{
                    children: headerItem,
                    imageId: detailQuery?.data?.imageId,
                    imageUrl: detailQuery?.data?.imageUrl,
                    route: AppRoute.LIBRARY_ALBUMS,
                    type: LibraryItem.ALBUM,
                }}
                title={detailQuery?.data?.name || ''}
            >
                <Stack gap="md" w="100%">
                    <Group className={styles.metadataGroup} gap="xs">
                        {metadataItems.map((item, index) => (
                            <Fragment key={item.id}>
                                {index > 0 && (
                                    <Text fw={400} isMuted isNoSelect>
                                        •
                                    </Text>
                                )}
                                <Text fw={400}>{item.value}</Text>
                            </Fragment>
                        ))}
                    </Group>
                    <Group className={styles.metadataGroup}>
                        <JoinedArtists
                            artistName={detailQuery?.data?.albumArtistName || ''}
                            artists={detailQuery?.data?.albumArtists || []}
                        />
                    </Group>
                    <LibraryHeaderMenu
                        favorite={detailQuery?.data?.userFavorite}
                        onFavorite={handleFavorite}
                        onMore={handleMoreOptions}
                        onPlay={(type) => handlePlay(type)}
                        onRating={handleUpdateRating}
                        onShuffle={() => handlePlay(Play.SHUFFLE)}
                        rating={detailQuery?.data?.userRating || 0}
                    />
                </Stack>
            </LibraryHeader>
        </Stack>
    );
});
