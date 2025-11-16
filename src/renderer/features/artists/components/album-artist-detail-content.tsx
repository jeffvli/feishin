import { useQuery } from '@tanstack/react-query';
import { Suspense, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { createSearchParams, generatePath, Link, useParams } from 'react-router';

import styles from './album-artist-detail-content.module.css';

import { AlbumInfiniteCarousel } from '/@/renderer/features/albums/components/album-infinite-carousel';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import { AlbumArtistGridCarousel } from '/@/renderer/features/artists/components/album-artist-grid-carousel';
import { usePlayQueueAdd } from '/@/renderer/features/player/hooks/use-playqueue-add';
import { LibraryBackgroundOverlay } from '/@/renderer/features/shared/components/library-background-overlay';
import { PlayButton } from '/@/renderer/features/shared/components/play-button';
import { useCreateFavorite } from '/@/renderer/features/shared/mutations/create-favorite-mutation';
import { useDeleteFavorite } from '/@/renderer/features/shared/mutations/delete-favorite-mutation';
import { useContainerQuery } from '/@/renderer/hooks';
import { useGenreRoute } from '/@/renderer/hooks/use-genre-route';
import { AppRoute } from '/@/renderer/router/routes';
import { ArtistItem, useCurrentServer } from '/@/renderer/store';
import { useGeneralSettings, usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { sanitize } from '/@/renderer/utils/sanitize';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Grid } from '/@/shared/components/grid/grid';
import { Group } from '/@/shared/components/group/group';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Spoiler } from '/@/shared/components/spoiler/spoiler';
import { Stack } from '/@/shared/components/stack/stack';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import {
    AlbumArtist,
    AlbumListSort,
    LibraryItem,
    ServerType,
    SortOrder,
} from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

interface AlbumArtistDetailContentProps {
    background?: string;
}

export const AlbumArtistDetailContent = ({ background }: AlbumArtistDetailContentProps) => {
    const { t } = useTranslation();
    const { artistItems, externalLinks, lastFM, musicBrainz } = useGeneralSettings();
    const { albumArtistId, artistId } = useParams() as {
        albumArtistId?: string;
        artistId?: string;
    };
    const routeId = (artistId || albumArtistId) as string;
    const { ref, ...cq } = useContainerQuery();
    const handlePlayQueueAdd = usePlayQueueAdd();
    const server = useCurrentServer();
    const genrePath = useGenreRoute();

    const [enabledItem, itemOrder] = useMemo(() => {
        const enabled: { [key in ArtistItem]?: boolean } = {};
        const order: { [key in ArtistItem]?: number } = {};

        for (const [idx, item] of artistItems.entries()) {
            enabled[item.id] = !item.disabled;
            order[item.id] = idx + 1;
        }

        return [enabled, order];
    }, [artistItems]);

    const detailQuery = useQuery(
        artistsQueries.albumArtistDetail({
            query: { id: routeId },
            serverId: server?.id,
        }),
    );

    const artistDiscographyLink = `${generatePath(
        AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL_DISCOGRAPHY,
        {
            albumArtistId: routeId,
        },
    )}?${createSearchParams({
        artistId: routeId,
        artistName: detailQuery?.data?.name || '',
    })}`;

    const artistSongsLink = `${generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL_SONGS, {
        albumArtistId: routeId,
    })}?${createSearchParams({
        artistId: routeId,
        artistName: detailQuery?.data?.name || '',
    })}`;

    const topSongsQuery = useQuery(
        artistsQueries.topSongs({
            options: {
                enabled: !!detailQuery?.data?.name && enabledItem.topSongs,
            },
            query: {
                artist: detailQuery?.data?.name || '',
                artistId: routeId,
            },
            serverId: server?.id,
        }),
    );

    const carousels = useMemo(() => {
        return [
            {
                isHidden: !enabledItem.recentAlbums || !routeId,
                itemType: LibraryItem.ALBUM,
                order: itemOrder.recentAlbums,
                query: {
                    artistIds: routeId ? [routeId] : undefined,
                    compilation: false,
                },
                sortBy: AlbumListSort.RELEASE_DATE,
                sortOrder: SortOrder.DESC,
                title: (
                    <Group align="flex-end">
                        <TextTitle fw={700} order={2}>
                            {t('page.albumArtistDetail.recentReleases', {
                                postProcess: 'sentenceCase',
                            })}
                        </TextTitle>
                        <Button
                            component={Link}
                            size="compact-md"
                            to={artistDiscographyLink}
                            variant="subtle"
                        >
                            {String(t('page.albumArtistDetail.viewDiscography')).toUpperCase()}
                        </Button>
                    </Group>
                ),
                uniqueId: 'recentReleases',
            },
            {
                isHidden:
                    !enabledItem.compilations || server?.type === ServerType.SUBSONIC || !routeId,
                itemType: LibraryItem.ALBUM,
                order: itemOrder.compilations,
                query: {
                    artistIds: routeId ? [routeId] : undefined,
                    compilation: true,
                },
                sortBy: AlbumListSort.RELEASE_DATE,
                sortOrder: SortOrder.DESC,
                title: (
                    <TextTitle fw={700} order={2}>
                        {t('page.albumArtistDetail.appearsOn', { postProcess: 'sentenceCase' })}
                    </TextTitle>
                ),
                uniqueId: 'compilationAlbums',
            },
            {
                data: (detailQuery?.data?.similarArtists || []) as AlbumArtist[],
                isHidden: !detailQuery?.data?.similarArtists || !enabledItem.similarArtists,
                itemType: LibraryItem.ALBUM_ARTIST,
                order: itemOrder.similarArtists,
                title: (
                    <TextTitle fw={700} order={2}>
                        {t('page.albumArtistDetail.relatedArtists', {
                            postProcess: 'sentenceCase',
                        })}
                    </TextTitle>
                ),
                uniqueId: 'similarArtists',
            },
        ];
    }, [
        artistDiscographyLink,
        detailQuery?.data?.similarArtists,
        enabledItem.compilations,
        enabledItem.recentAlbums,
        enabledItem.similarArtists,
        itemOrder.compilations,
        itemOrder.recentAlbums,
        itemOrder.similarArtists,
        routeId,
        server?.type,
        t,
    ]);

    const playButtonBehavior = usePlayButtonBehavior();

    const handlePlay = async (playType?: Play) => {
        handlePlayQueueAdd?.({
            byItemType: {
                id: [routeId],
                type: albumArtistId ? LibraryItem.ALBUM_ARTIST : LibraryItem.ARTIST,
            },
            playType: playType || playButtonBehavior,
        });
    };

    const createFavoriteMutation = useCreateFavorite({});
    const deleteFavoriteMutation = useDeleteFavorite({});

    const handleFavorite = () => {
        if (!detailQuery?.data) return;

        if (detailQuery.data.userFavorite) {
            deleteFavoriteMutation.mutate({
                apiClientProps: { serverId: detailQuery.data._serverId },
                query: {
                    id: [detailQuery.data.id],
                    type: LibraryItem.ALBUM_ARTIST,
                },
            });
        } else {
            createFavoriteMutation.mutate({
                apiClientProps: { serverId: detailQuery.data._serverId },
                query: {
                    id: [detailQuery.data.id],
                    type: LibraryItem.ALBUM_ARTIST,
                },
            });
        }
    };

    const albumCount = detailQuery?.data?.albumCount;

    const biography = useMemo(() => {
        const bio = detailQuery?.data?.biography;

        if (!bio || !enabledItem.biography) return null;
        return sanitize(bio);
    }, [detailQuery?.data?.biography, enabledItem.biography]);

    const showTopSongs = topSongsQuery?.data?.items?.length && enabledItem.topSongs;
    const showGenres = detailQuery?.data?.genres ? detailQuery?.data?.genres.length !== 0 : false;
    const mbzId = detailQuery?.data?.mbz;

    const isLoading =
        detailQuery?.isLoading ||
        (server?.type === ServerType.NAVIDROME && enabledItem.topSongs && topSongsQuery?.isLoading);

    if (isLoading) return <div className={styles.contentContainer} ref={ref} />;

    return (
        <div className={styles.contentContainer} ref={ref}>
            <LibraryBackgroundOverlay backgroundColor={background} />
            <div className={styles.detailContainer}>
                <Group gap="md">
                    <PlayButton
                        disabled={albumCount === 0}
                        onClick={() => handlePlay(playButtonBehavior)}
                    />
                    <Group gap="xs">
                        <ActionIcon
                            icon="favorite"
                            iconProps={{
                                fill: detailQuery?.data?.userFavorite ? 'primary' : undefined,
                            }}
                            loading={
                                createFavoriteMutation.isPending || deleteFavoriteMutation.isPending
                            }
                            onClick={handleFavorite}
                            size="lg"
                            variant="transparent"
                        />
                        <ActionIcon
                            icon="ellipsisHorizontal"
                            onClick={(e) => {
                                if (!detailQuery?.data) return;
                            }}
                            size="lg"
                            variant="transparent"
                        />
                    </Group>
                </Group>
                <Group gap="md">
                    <Button
                        component={Link}
                        size="compact-md"
                        to={artistDiscographyLink}
                        variant="subtle"
                    >
                        {String(t('page.albumArtistDetail.viewDiscography')).toUpperCase()}
                    </Button>
                    <Button
                        component={Link}
                        size="compact-md"
                        to={artistSongsLink}
                        variant="subtle"
                    >
                        {String(t('page.albumArtistDetail.viewAllTracks')).toUpperCase()}
                    </Button>
                </Group>
                {showGenres ? (
                    <section>
                        <Group gap="sm">
                            {detailQuery?.data?.genres?.map((genre) => (
                                <Button
                                    component={Link}
                                    key={`genre-${genre.id}`}
                                    radius="md"
                                    size="compact-md"
                                    to={generatePath(genrePath, {
                                        genreId: genre.id,
                                    })}
                                    variant="outline"
                                >
                                    {genre.name}
                                </Button>
                            ))}
                        </Group>
                    </section>
                ) : null}
                {externalLinks && (lastFM || musicBrainz) ? (
                    <section>
                        <Group gap="sm">
                            {lastFM && (
                                <ActionIcon
                                    component="a"
                                    href={`https://www.last.fm/music/${encodeURIComponent(
                                        detailQuery?.data?.name || '',
                                    )}`}
                                    icon="brandLastfm"
                                    iconProps={{
                                        fill: 'default',
                                        size: 'xl',
                                    }}
                                    rel="noopener noreferrer"
                                    target="_blank"
                                    tooltip={{
                                        label: t('action.openIn.lastfm'),
                                    }}
                                    variant="subtle"
                                />
                            )}
                            {mbzId && musicBrainz ? (
                                <ActionIcon
                                    component="a"
                                    href={`https://musicbrainz.org/artist/${mbzId}`}
                                    icon="brandMusicBrainz"
                                    iconProps={{
                                        fill: 'default',
                                        size: 'xl',
                                    }}
                                    rel="noopener noreferrer"
                                    target="_blank"
                                    tooltip={{
                                        label: t('action.openIn.musicbrainz'),
                                    }}
                                    variant="subtle"
                                />
                            ) : null}
                        </Group>
                    </section>
                ) : null}
                <Grid gutter="xl">
                    {biography ? (
                        <Grid.Col order={itemOrder.biography} span={12}>
                            <section style={{ maxWidth: '1280px' }}>
                                <TextTitle fw={700} order={2}>
                                    {t('page.albumArtistDetail.about', {
                                        artist: detailQuery?.data?.name,
                                    })}
                                </TextTitle>
                                <Spoiler dangerouslySetInnerHTML={{ __html: biography }} />
                            </section>
                        </Grid.Col>
                    ) : null}
                    {showTopSongs ? (
                        <Grid.Col order={itemOrder.topSongs} span={12}>
                            <section>
                                <Group justify="space-between" wrap="nowrap">
                                    <Group align="flex-end" wrap="nowrap">
                                        <TextTitle fw={700} order={2}>
                                            {t('page.albumArtistDetail.topSongs', {
                                                postProcess: 'sentenceCase',
                                            })}
                                        </TextTitle>
                                        <Button
                                            component={Link}
                                            size="compact-md"
                                            to={generatePath(
                                                AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL_TOP_SONGS,
                                                {
                                                    albumArtistId: routeId,
                                                },
                                            )}
                                            uppercase
                                            variant="subtle"
                                        >
                                            {t('page.albumArtistDetail.viewAll', {
                                                postProcess: 'sentenceCase',
                                            })}
                                        </Button>
                                    </Group>
                                </Group>
                            </section>
                        </Grid.Col>
                    ) : null}

                    {carousels
                        .filter((c) => !c.isHidden)
                        .map((carousel) => (
                            <Grid.Col
                                key={`carousel-${carousel.uniqueId}`}
                                order={carousel.order}
                                span={12}
                            >
                                <section>
                                    <Stack gap="xl">
                                        {carousel.itemType === LibraryItem.ALBUM ? (
                                            'query' in carousel &&
                                            carousel.query &&
                                            carousel.sortBy &&
                                            carousel.sortOrder ? (
                                                <Suspense fallback={<Spinner container />}>
                                                    <AlbumInfiniteCarousel
                                                        query={carousel.query}
                                                        rowCount={1}
                                                        sortBy={carousel.sortBy}
                                                        sortOrder={carousel.sortOrder}
                                                        title={carousel.title}
                                                    />
                                                </Suspense>
                                            ) : null
                                        ) : carousel.itemType === LibraryItem.ALBUM_ARTIST ? (
                                            'data' in carousel && carousel.data ? (
                                                <AlbumArtistGridCarousel
                                                    data={carousel.data}
                                                    rowCount={1}
                                                    title={carousel.title}
                                                />
                                            ) : null
                                        ) : null}
                                    </Stack>
                                </section>
                            </Grid.Col>
                        ))}
                </Grid>
            </div>
        </div>
    );
};
