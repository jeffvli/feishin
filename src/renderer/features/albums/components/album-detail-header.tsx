import { useQuery } from '@tanstack/react-query';
import { forwardRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link, useParams } from 'react-router';

import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { LibraryHeader } from '/@/renderer/features/shared/components/library-header';
import { useGenreRoute } from '/@/renderer/hooks/use-genre-route';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { formatDateAbsoluteUTC, formatDurationString, titleCase } from '/@/renderer/utils';
import { normalizeReleaseTypes } from '/@/renderer/utils/normalize-release-types';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Pill } from '/@/shared/components/pill/pill';
import { Rating } from '/@/shared/components/rating/rating';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem, ServerType } from '/@/shared/types/domain-types';

interface AlbumDetailHeaderProps {
    background: {
        background?: string;
        blur: number;
        loading: boolean;
    };
}

export const AlbumDetailHeader = forwardRef<HTMLDivElement, AlbumDetailHeaderProps>(
    ({ background }, ref) => {
        const { albumId } = useParams() as { albumId: string };
        const server = useCurrentServer();
        const detailQuery = useQuery(
            albumQueries.detail({ query: { id: albumId }, serverId: server?.id }),
        );
        const { t } = useTranslation();
        const genreRoute = useGenreRoute();

        const showRating =
            detailQuery?.data?._serverType === ServerType.NAVIDROME ||
            detailQuery?.data?._serverType === ServerType.SUBSONIC;

        const showGenres = detailQuery?.data?.genres
            ? detailQuery?.data?.genres.length !== 0
            : false;

        const originalDifferentFromRelease =
            detailQuery.data?.originalDate &&
            detailQuery.data.originalDate !== detailQuery.data.releaseDate;

        const releasePrefix = originalDifferentFromRelease
            ? t('page.albumDetail.released', { postProcess: 'sentenceCase' })
            : '♫';

        const releaseTypes = useMemo(
            () =>
                normalizeReleaseTypes(detailQuery.data?.releaseTypes ?? [], t).map((type) => ({
                    id: type,
                    value: titleCase(type),
                })) || [],
            [detailQuery.data?.releaseTypes, t],
        );

        const metadataItems = releaseTypes.concat([
            {
                id: 'releaseDate',
                value:
                    detailQuery?.data?.releaseDate &&
                    `${releasePrefix} ${formatDateAbsoluteUTC(detailQuery?.data?.releaseDate)}`,
            },
            {
                id: 'songCount',
                value: t('entity.trackWithCount', {
                    count: detailQuery?.data?.songCount as number,
                }),
            },
            {
                id: 'duration',
                value:
                    detailQuery?.data?.duration && formatDurationString(detailQuery.data.duration),
            },
            {
                id: 'playCount',
                value:
                    typeof detailQuery?.data?.playCount === 'number' &&
                    t('entity.play', {
                        count: detailQuery?.data?.playCount,
                    }),
            },
            {
                id: 'version',
                value: detailQuery.data?.version,
            },
        ]);

        if (originalDifferentFromRelease) {
            const formatted = `♫ ${formatDateAbsoluteUTC(detailQuery!.data!.originalDate)}`;
            metadataItems.splice(0, 0, {
                id: 'originalDate',
                value: formatted,
            });
        }

        const { setFavorite, setRating } = usePlayer();

        const handleFavorite = () => {
            if (!detailQuery?.data) return;
            setFavorite(
                detailQuery.data._serverId,
                [detailQuery.data.id],
                LibraryItem.ALBUM,
                !detailQuery.data.userFavorite,
            );
        };

        const handleUpdateRating = (rating: number) => {
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
        };

        return (
            <Stack ref={ref}>
                <LibraryHeader
                    imageUrl={detailQuery?.data?.imageUrl}
                    item={{ route: AppRoute.LIBRARY_ALBUMS, type: LibraryItem.ALBUM }}
                    title={detailQuery?.data?.name || ''}
                    {...background}
                >
                    <Pill.Group>
                        {metadataItems.map(
                            (item, index) =>
                                item.value && (
                                    <Pill key={`item-${item.id}-${index}`}>{item.value}</Pill>
                                ),
                        )}
                    </Pill.Group>
                    {showGenres && (
                        <Group gap="sm">
                            {detailQuery?.data?.genres?.map((genre) => (
                                <Button
                                    component={Link}
                                    key={`genre-${genre.id}`}
                                    radius="md"
                                    size="compact-md"
                                    to={generatePath(genreRoute, {
                                        genreId: genre.id,
                                    })}
                                    variant="outline"
                                >
                                    {genre.name}
                                </Button>
                            ))}
                        </Group>
                    )}
                    <Group align="center" gap="sm">
                        <ActionIcon
                            icon="favorite"
                            iconProps={{
                                fill: detailQuery?.data?.userFavorite ? 'primary' : undefined,
                                size: 'lg',
                            }}
                            onClick={handleFavorite}
                            size="xs"
                            variant="transparent"
                        />
                        {showRating && (
                            <Rating
                                onChange={handleUpdateRating}
                                readOnly={detailQuery?.isFetching}
                                styles={{
                                    input: {
                                        background: 'transparent',
                                    },
                                }}
                                value={detailQuery?.data?.userRating || 0}
                            />
                        )}
                    </Group>
                    <Group
                        gap="md"
                        mah="4rem"
                        style={{
                            overflow: 'hidden',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 2,
                        }}
                    >
                        {detailQuery?.data?.albumArtists.map((artist) => (
                            <Text
                                component={Link}
                                fw={600}
                                isLink
                                key={`artist-${artist.id}`}
                                to={generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                                    albumArtistId: artist.id,
                                })}
                                variant="subtle"
                            >
                                {artist.name}
                            </Text>
                        ))}
                    </Group>
                </LibraryHeader>
            </Stack>
        );
    },
);
