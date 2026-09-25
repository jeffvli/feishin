import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { Fragment, MouseEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createSearchParams, generatePath, Link } from 'react-router';
import { shallow } from 'zustand/shallow';

import styles from './sidebar-now-playing.module.css';

import { queryKeys } from '/@/renderer/api/query-keys';
import cardStyles from '/@/renderer/components/item-card/item-card.module.css';
import { ItemImage } from '/@/renderer/components/item-image/item-image';
import {
    JOINED_ARTISTS_MUTED_PROPS,
    JoinedArtists,
} from '/@/renderer/features/albums/components/joined-artists';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import { AlbumArtistActionButtons } from '/@/renderer/features/artists/components/album-artist-action-buttons';
import { AlbumArtistGridCarousel } from '/@/renderer/features/artists/components/album-artist-grid-carousel';
import { AlbumArtistTopSongs } from '/@/renderer/features/artists/components/album-artist-top-songs';
import { ContextMenuController } from '/@/renderer/features/context-menu/context-menu-controller';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { useSetFavorite } from '/@/renderer/features/shared/hooks/use-set-favorite';
import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import { useGenreRoute } from '/@/renderer/hooks/use-genre-route';
import { AppRoute } from '/@/renderer/router/routes';
import {
    SidebarNowPlayingItem,
    useCurrentServer,
    useCurrentServerId,
    useExternalLinks,
    useFullScreenPlayerStore,
    usePlayerSong,
    useSetFullScreenPlayerStore,
    useShowFavorites,
    useSidebarNowPlayingSettings,
} from '/@/renderer/store';
import { useArtistRadioCount } from '/@/renderer/store/settings.store';
import { formatDurationString } from '/@/renderer/utils';
import { logger } from '/@/renderer/utils/logger';
import { sanitize } from '/@/renderer/utils/sanitize';
import { SEPARATOR_STRING } from '/@/shared/api/utils';
import { ActionIcon, ActionIconGroup } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import { Text } from '/@/shared/components/text/text';
import { AlbumArtist, LibraryItem, ServerType } from '/@/shared/types/domain-types';
import { ItemListKey, Play } from '/@/shared/types/types';

const SIMILAR_LIMIT = 10;

const getListenBrainzUrl = (mbzId: null | string | undefined, artistName?: string) => {
    if (mbzId) {
        return `https://listenbrainz.org/artist/${mbzId}`;
    }

    if (artistName) {
        return `https://listenbrainz.org/search/?search_term=${encodeURIComponent(artistName)}`;
    }

    return null;
};

const getQobuzUrl = (artistName?: string) => {
    if (artistName) {
        return `https://www.qobuz.com/us-en/search/artists/${encodeURIComponent(artistName)}`;
    }

    return null;
};

export const SidebarNowPlaying = () => {
    const { t } = useTranslation();
    const song = usePlayerSong();
    const player = usePlayer();
    const queryClient = useQueryClient();
    const artistRadioCount = useArtistRadioCount();
    const server = useCurrentServer();
    const serverId = useCurrentServerId();
    const setFavorite = useSetFavorite();
    const showFavorites = useShowFavorites();
    const genrePath = useGenreRoute();
    const { externalLinks, lastFM, listenBrainz, musicBrainz, nativeSpotify, qobuz, spotify } =
        useExternalLinks();
    const { items } = useSidebarNowPlayingSettings();
    const [bioExpanded, setBioExpanded] = useState(false);
    const setFullScreenPlayerStore = useSetFullScreenPlayerStore();
    const {
        expanded: isFullScreenPlayerExpanded,
        visualizerExpanded: isFullScreenVisualizerExpanded,
    } = useFullScreenPlayerStore(
        (state) => ({
            expanded: state.expanded,
            visualizerExpanded: state.visualizerExpanded,
        }),
        shallow,
    );

    const isEnabled = useCallback(
        (id: SidebarNowPlayingItem) => items.some((item) => item.id === id && item.isEnabled),
        [items],
    );

    const orderedItems = useMemo(() => {
        const top = items.filter((item) => item.pinned === 'left');
        const middle = items.filter((item) => item.pinned !== 'left' && item.pinned !== 'right');
        const bottom = items.filter((item) => item.pinned === 'right');
        return [...top, ...middle, ...bottom];
    }, [items]);

    const wrapSection = useCallback((item: (typeof items)[number], node: ReactNode) => {
        return (
            <div
                className={clsx(styles.section, {
                    [styles.center]: item.align === 'center',
                    [styles.left]: item.align === 'start',
                    [styles.right]: item.align === 'end',
                })}
                key={item.id}
                style={item.autoSize ? undefined : { width: item.width }}
            >
                {node}
            </div>
        );
    }, []);

    const artist = song?.albumArtists?.[0] ?? song?.artists?.[0];
    const artistId = artist?.id;

    useEffect(() => {
        setBioExpanded(false);
    }, [artistId, song?.id]);

    const detailQuery = useQuery({
        ...artistsQueries.albumArtistDetail({
            query: { id: artistId || '' },
            serverId: server?.id,
        }),
        enabled: Boolean(server?.id && artistId),
        placeholderData: keepPreviousData,
    });

    const infoQuery = useQuery({
        ...artistsQueries.albumArtistInfo({
            query: { id: artistId || '', limit: SIMILAR_LIMIT },
            serverId: server?.id,
        }),
        enabled: Boolean(server?.id && artistId),
        placeholderData: keepPreviousData,
    });

    const handleToggleFavorite = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            if (!song?.id) return;
            setFavorite(song._serverId, [song.id], LibraryItem.SONG, !song.userFavorite);
        },
        [setFavorite, song],
    );

    const handleContextMenu = useCallback(
        (e: MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            if (!song) return;
            ContextMenuController.call({
                cmd: { items: [song], type: LibraryItem.SONG },
                event: e,
            });
        },
        [song],
    );

    // Match player-bar cover art: toggle fullscreen player
    const handleTrackArtClick = useCallback(
        (e: MouseEvent<HTMLDivElement>) => {
            if (e.button === 2) return;
            e.stopPropagation();

            const shouldClose = isFullScreenPlayerExpanded || isFullScreenVisualizerExpanded;

            if (shouldClose) {
                setFullScreenPlayerStore({
                    expanded: false,
                    visualizerExpanded: false,
                    visualizerReturnToPlayer: false,
                });
            } else {
                setFullScreenPlayerStore({ expanded: true });
            }
        },
        [isFullScreenPlayerExpanded, isFullScreenVisualizerExpanded, setFullScreenPlayerStore],
    );

    const artistDetail = detailQuery.data;
    const artistInfo = infoQuery.data;
    const biography = artistInfo?.biography || artistDetail?.biography;
    const sanitizedBiography = biography ? sanitize(biography) : '';
    const artistImageUrl = artistInfo?.imageUrl || artistDetail?.imageUrl;
    const artistImageId = artistDetail?.imageId ?? artist?.imageId;
    const artistName = artistDetail?.name || artist?.name || '';

    const artistDiscographyLink = artistId
        ? `${generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL_DISCOGRAPHY, {
              albumArtistId: artistId,
          })}?${createSearchParams({
              artistId,
              artistName,
          })}`
        : undefined;

    const artistSongsLink = artistId
        ? `${generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL_SONGS, {
              albumArtistId: artistId,
          })}?${createSearchParams({
              artistId,
              artistName,
          })}`
        : undefined;

    const handleArtistRadio = useCallback(async () => {
        if (!server?.id || !artistId) return;

        try {
            const artistRadioSongs = await queryClient.fetchQuery({
                ...songsQueries.artistRadio({
                    query: {
                        artistId,
                        count: artistRadioCount,
                    },
                    serverId: server.id,
                }),
                queryKey: queryKeys.player.fetch({ artistId }),
            });
            if (artistRadioSongs && artistRadioSongs.length > 0) {
                player.addToQueueByData(artistRadioSongs, Play.NOW);
            }
        } catch (error) {
            logger.error('Failed to load artist radio', { error });
        }
    }, [artistId, artistRadioCount, player, queryClient, server]);
    const artistRoute = artistId
        ? generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, { albumArtistId: artistId })
        : undefined;
    const genres = artistDetail?.genres ?? [];
    const mbzId = artistDetail?.mbz;
    const listenBrainzUrl = getListenBrainzUrl(mbzId, artistName);
    const qobuzUrl = getQobuzUrl(artistName);
    const showExternalLinks =
        isEnabled(SidebarNowPlayingItem.EXTERNAL_LINKS) &&
        Boolean(artistName) &&
        externalLinks &&
        (lastFM || listenBrainz || musicBrainz || qobuz || spotify);
    const showArtistBio = isEnabled(SidebarNowPlayingItem.ARTIST_BIO);
    const artistIsFavorite = Boolean(artistDetail?.userFavorite ?? artist?.userFavorite);

    const albumCount = artistDetail?.albumCount;
    const songCount = artistDetail?.songCount;
    const duration = artistDetail?.duration;
    const durationEnabled = duration !== null && duration !== undefined;

    // Same metadata items / styling as album-artist-detail-header
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
            value: durationEnabled ? formatDurationString(duration) : '',
        },
    ].filter((item) => item.enabled);

    const similarArtists = useMemo((): AlbumArtist[] => {
        const relatedArtists = artistInfo?.similarArtists ?? [];
        if (relatedArtists.length === 0) {
            return [];
        }

        return relatedArtists.map((relatedArtist) => ({
            _itemType: LibraryItem.ALBUM_ARTIST,
            _serverId: serverId || '',
            _serverType: (server?.type as ServerType) || ServerType.JELLYFIN,
            albumCount: null,
            biography: null,
            blurHash: null,
            dominantColor: null,
            duration: null,
            genres: [],
            id: relatedArtist.id,
            imageId: relatedArtist.imageId,
            imageUrl: relatedArtist.imageUrl,
            lastPlayedAt: null,
            mbz: null,
            missing: null,
            name: relatedArtist.name,
            playCount: null,
            ratedAt: null,
            similarArtists: null,
            songCount: null,
            starredAt: null,
            thumbHash: null,
            userFavorite: relatedArtist.userFavorite,
            userRating: relatedArtist.userRating,
        }));
    }, [artistInfo?.similarArtists, server?.type, serverId]);

    if (!song) {
        return (
            <div className={styles.empty}>
                <Text isMuted>{t('page.nowPlaying.empty')}</Text>
            </div>
        );
    }

    const titleRow = (
        <Group align="flex-start" gap="xs" justify="space-between" wrap="nowrap">
            <TextTitle className={styles.trackTitle} fw={700} order={2} overflow="hidden">
                {song.name}
            </TextTitle>
            <ActionIconGroup>
                {showFavorites && (
                    <ActionIcon
                        icon="favorite"
                        iconProps={{
                            fill: song.userFavorite ? 'primary' : undefined,
                            size: 'md',
                        }}
                        onClick={handleToggleFavorite}
                        size="sm"
                        tooltip={{
                            label: song.userFavorite
                                ? t('player.unfavorite')
                                : t('player.favorite'),
                        }}
                        variant="subtle"
                    />
                )}
                <ActionIcon
                    icon="ellipsisHorizontal"
                    iconProps={{ size: 'md' }}
                    onClick={handleContextMenu}
                    size="sm"
                    variant="subtle"
                />
            </ActionIconGroup>
        </Group>
    );

    const sections: ReactNode[] = [];
    const metaChildren: ReactNode[] = [titleRow];
    let metaFlushed = false;
    let metaInsertAt: null | number = null;

    const flushMeta = () => {
        if (metaFlushed) return;
        const metaStack = (
            <Stack gap="xs" key="track-meta">
                {metaChildren}
            </Stack>
        );
        if (metaInsertAt === null) {
            sections.push(metaStack);
        } else {
            sections.splice(metaInsertAt, 0, metaStack);
        }
        metaFlushed = true;
    };

    const addMetaChild = (node: ReactNode) => {
        if (metaFlushed) {
            sections.push(node);
            return;
        }
        if (metaInsertAt === null) {
            metaInsertAt = sections.length;
        }
        metaChildren.push(node);
    };

    for (const item of orderedItems) {
        if (!item.isEnabled) continue;

        switch (item.id) {
            case SidebarNowPlayingItem.ALBUM:
                if (song.album) {
                    addMetaChild(
                        <Text
                            component={Link}
                            fw={500}
                            isLink
                            isMuted
                            key={item.id}
                            overflow="hidden"
                            size="lg"
                            to={
                                song.albumId
                                    ? generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
                                          albumId: song.albumId,
                                      })
                                    : ''
                            }
                        >
                            {song.album}
                        </Text>,
                    );
                }
                break;

            case SidebarNowPlayingItem.ARTIST_ACTIONS:
                flushMeta();
                if (artistDiscographyLink && artistSongsLink) {
                    sections.push(
                        wrapSection(
                            item,
                            <AlbumArtistActionButtons
                                artistDiscographyLink={artistDiscographyLink}
                                artistSongsLink={artistSongsLink}
                                onArtistRadio={handleArtistRadio}
                            />,
                        ),
                    );
                }
                break;

            case SidebarNowPlayingItem.ARTIST_BIO:
                if (!isEnabled(SidebarNowPlayingItem.ARTIST_CARD) && sanitizedBiography) {
                    flushMeta();
                    sections.push(
                        wrapSection(
                            item,
                            <div className={styles.artistBioExpanded}>
                                <Text
                                    className={styles.artistHeroBio}
                                    dangerouslySetInnerHTML={{ __html: sanitizedBiography }}
                                    size="sm"
                                />
                            </div>,
                        ),
                    );
                }
                break;

            case SidebarNowPlayingItem.ARTIST_CARD:
                flushMeta();
                if (artistId && artistRoute) {
                    sections.push(
                        wrapSection(
                            item,
                            <div className={styles.artistCard}>
                                <div className={styles.artistHero}>
                                    <ItemImage
                                        blurHash={artistDetail?.blurHash}
                                        enableDebounce={false}
                                        enableViewport={false}
                                        id={artistImageId}
                                        itemType={LibraryItem.ALBUM_ARTIST}
                                        serverId={server?.id}
                                        src={artistImageUrl}
                                        thumbHash={artistDetail?.thumbHash}
                                        type="sidebar"
                                    />
                                    {showFavorites && artistIsFavorite && (
                                        <div
                                            className={clsx(
                                                cardStyles.favoriteBadge,
                                                styles.artistFavoriteBadge,
                                            )}
                                        />
                                    )}
                                    <div className={styles.artistHeroDim} />
                                    <div className={styles.artistHeroOverlay}>
                                        {artistName && (
                                            <Text
                                                className={styles.artistHeroName}
                                                component={Link}
                                                fw={700}
                                                to={artistRoute}
                                            >
                                                {artistName}
                                            </Text>
                                        )}
                                        {metadataItems.length > 0 && (
                                            <Group
                                                className={styles.artistHeroStats}
                                                gap="xs"
                                                wrap="wrap"
                                            >
                                                {metadataItems.map((meta, index) => (
                                                    <Fragment key={`item-${meta.id}-${index}`}>
                                                        {index > 0 && (
                                                            <Text
                                                                className={
                                                                    styles.artistHeroStatsSeparator
                                                                }
                                                                isNoSelect
                                                            >
                                                                {SEPARATOR_STRING}
                                                            </Text>
                                                        )}
                                                        <Text
                                                            className={clsx({
                                                                [styles.artistHeroStatsSecondary]:
                                                                    meta.secondary,
                                                            })}
                                                        >
                                                            {meta.value}
                                                        </Text>
                                                    </Fragment>
                                                ))}
                                            </Group>
                                        )}
                                        {showArtistBio && sanitizedBiography && !bioExpanded && (
                                            <>
                                                <Text
                                                    className={styles.artistHeroBio}
                                                    dangerouslySetInnerHTML={{
                                                        __html: sanitizedBiography,
                                                    }}
                                                    size="sm"
                                                />
                                                <Button
                                                    classNames={{ root: styles.artistHeroMore }}
                                                    onClick={() => setBioExpanded(true)}
                                                    size="compact-sm"
                                                    variant="transparent"
                                                >
                                                    {t('page.nowPlaying.showMore')}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {showArtistBio && sanitizedBiography && bioExpanded && (
                                    <div className={styles.artistBioExpanded}>
                                        <Text
                                            className={styles.artistHeroBio}
                                            dangerouslySetInnerHTML={{ __html: sanitizedBiography }}
                                            size="sm"
                                        />
                                        <Button
                                            classNames={{ root: styles.artistHeroMore }}
                                            onClick={() => setBioExpanded(false)}
                                            size="compact-sm"
                                            variant="transparent"
                                        >
                                            {t('page.nowPlaying.showLess')}
                                        </Button>
                                    </div>
                                )}
                            </div>,
                        ),
                    );
                }
                break;

            case SidebarNowPlayingItem.EXTERNAL_LINKS:
                flushMeta();
                if (showExternalLinks) {
                    sections.push(
                        wrapSection(
                            item,
                            <Stack gap="xs">
                                <Text fw={600} isNoSelect size="sm" tt="uppercase">
                                    {t('common.externalLinks')}
                                </Text>
                                <Group gap="xs">
                                    {lastFM && (
                                        <ActionIcon
                                            component="a"
                                            href={`https://www.last.fm/music/${encodeURIComponent(artistName)}`}
                                            icon="brandLastfm"
                                            iconProps={{ size: '2xl' }}
                                            rel="noopener noreferrer"
                                            target="_blank"
                                            tooltip={{ label: t('action.openIn.lastfm') }}
                                            variant="subtle"
                                        />
                                    )}
                                    {mbzId && musicBrainz ? (
                                        <ActionIcon
                                            component="a"
                                            href={`https://musicbrainz.org/artist/${mbzId}`}
                                            icon="brandMusicBrainz"
                                            iconProps={{ size: '2xl' }}
                                            rel="noopener noreferrer"
                                            target="_blank"
                                            tooltip={{ label: t('action.openIn.musicbrainz') }}
                                            variant="subtle"
                                        />
                                    ) : null}
                                    {listenBrainz && listenBrainzUrl && (
                                        <ActionIcon
                                            component="a"
                                            href={listenBrainzUrl}
                                            icon="brandListenBrainz"
                                            iconProps={{ size: '2xl' }}
                                            rel="noopener noreferrer"
                                            target="_blank"
                                            tooltip={{ label: t('action.openIn.listenbrainz') }}
                                            variant="subtle"
                                        />
                                    )}
                                    {qobuz && qobuzUrl && (
                                        <ActionIcon
                                            component="a"
                                            href={qobuzUrl}
                                            icon="brandQobuz"
                                            iconProps={{ size: '2xl' }}
                                            rel="noopener noreferrer"
                                            target="_blank"
                                            tooltip={{ label: t('action.openIn.qobuz') }}
                                            variant="subtle"
                                        />
                                    )}
                                    {spotify && (
                                        <ActionIcon
                                            component="a"
                                            href={
                                                nativeSpotify
                                                    ? `spotify:search:${encodeURIComponent(artistName)}`
                                                    : `https://open.spotify.com/search/${encodeURIComponent(artistName)}`
                                            }
                                            icon="brandSpotify"
                                            iconProps={{ size: '2xl' }}
                                            rel="noopener noreferrer"
                                            target={nativeSpotify ? undefined : '_blank'}
                                            tooltip={{ label: t('action.openIn.spotify') }}
                                            variant="subtle"
                                        />
                                    )}
                                </Group>
                            </Stack>,
                        ),
                    );
                }
                break;

            case SidebarNowPlayingItem.GENRES:
                flushMeta();
                if (genres.length > 0) {
                    sections.push(
                        wrapSection(
                            item,
                            <Stack gap="xs">
                                <Text fw={600} isNoSelect size="sm" tt="uppercase">
                                    {t('entity.genre', { count: genres.length })}
                                </Text>
                                <Group gap="sm">
                                    {genres.map((genre) => (
                                        <Button
                                            component={Link}
                                            key={`genre-${genre.id}`}
                                            radius="md"
                                            size="compact-md"
                                            to={generatePath(genrePath, {
                                                albumArtistId: null,
                                                albumId: null,
                                                artistId: null,
                                                genreId: genre.id,
                                                itemType: null,
                                                playlistId: null,
                                            })}
                                            variant="outline"
                                        >
                                            {genre.name}
                                        </Button>
                                    ))}
                                </Group>
                            </Stack>,
                        ),
                    );
                }
                break;

            case SidebarNowPlayingItem.SIMILAR_ARTISTS:
                flushMeta();
                if (similarArtists.length > 0) {
                    sections.push(
                        wrapSection(
                            item,
                            <AlbumArtistGridCarousel
                                data={similarArtists}
                                excludeIds={artistId ? [artistId] : undefined}
                                isLoading={infoQuery.isLoading}
                                rowCount={1}
                                title={t('page.albumArtistDetail.relatedArtists')}
                            />,
                        ),
                    );
                }
                break;

            case SidebarNowPlayingItem.TOP_SONGS:
                flushMeta();
                if (artistId) {
                    sections.push(
                        wrapSection(
                            item,
                            <AlbumArtistTopSongs
                                artistName={artistName}
                                listKey={ItemListKey.SIDE_QUEUE}
                                routeId={artistId}
                            />,
                        ),
                    );
                }
                break;

            case SidebarNowPlayingItem.TRACK_ART:
                sections.push(
                    wrapSection(
                        item,
                        <div
                            className={styles.image}
                            onClick={handleTrackArtClick}
                            onContextMenu={handleContextMenu}
                            role="button"
                        >
                            <ItemImage
                                blurHash={song.blurHash}
                                enableDebounce={false}
                                enableViewport={false}
                                explicitStatus={song.explicitStatus}
                                fetchPriority="high"
                                id={song.imageId}
                                itemType={LibraryItem.SONG}
                                serverId={song._serverId}
                                src={song.imageUrl}
                                thumbHash={song.thumbHash}
                                type="sidebar"
                            />
                            {showFavorites && song.userFavorite && (
                                <div
                                    className={clsx(
                                        cardStyles.favoriteBadge,
                                        styles.trackFavoriteBadge,
                                    )}
                                />
                            )}
                        </div>,
                    ),
                );
                break;

            case SidebarNowPlayingItem.TRACK_ARTIST: {
                addMetaChild(
                    <JoinedArtists
                        artistName={song.artistName || ''}
                        artists={song.artists || []}
                        key={item.id}
                        linkProps={{
                            ...JOINED_ARTISTS_MUTED_PROPS.linkProps,
                            size: 'lg',
                        }}
                        rootTextProps={{
                            ...JOINED_ARTISTS_MUTED_PROPS.rootTextProps,
                            size: 'lg',
                        }}
                    />,
                );
                break;
            }

            default:
                break;
        }
    }

    flushMeta();

    return (
        <div className={styles.scroll}>
            <Stack gap="md">{sections}</Stack>
        </div>
    );
};
