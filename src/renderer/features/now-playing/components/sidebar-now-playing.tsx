import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link } from 'react-router';

import styles from './sidebar-now-playing.module.css';

import cardStyles from '/@/renderer/components/item-card/item-card.module.css';
import { ItemImage } from '/@/renderer/components/item-image/item-image';
import {
    JOINED_ARTISTS_MUTED_PROPS,
    JoinedArtists,
} from '/@/renderer/features/albums/components/joined-artists';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import { AlbumArtistGridCarousel } from '/@/renderer/features/artists/components/album-artist-grid-carousel';
import { ContextMenuController } from '/@/renderer/features/context-menu/context-menu-controller';
import { useSetFavorite } from '/@/renderer/features/shared/hooks/use-set-favorite';
import { useGenreRoute } from '/@/renderer/hooks/use-genre-route';
import { AppRoute } from '/@/renderer/router/routes';
import {
    useCurrentServer,
    useCurrentServerId,
    useExternalLinks,
    usePlayerSong,
    useShowFavorites,
} from '/@/renderer/store';
import { sanitize } from '/@/renderer/utils/sanitize';
import { SEPARATOR_STRING } from '/@/shared/api/utils';
import { ActionIcon, ActionIconGroup } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { AlbumArtist, LibraryItem, ServerType } from '/@/shared/types/domain-types';

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
    const server = useCurrentServer();
    const serverId = useCurrentServerId();
    const setFavorite = useSetFavorite();
    const showFavorites = useShowFavorites();
    const genrePath = useGenreRoute();
    const { externalLinks, lastFM, listenBrainz, musicBrainz, nativeSpotify, qobuz, spotify } =
        useExternalLinks();
    const [bioExpanded, setBioExpanded] = useState(false);

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
    });

    const infoQuery = useQuery({
        ...artistsQueries.albumArtistInfo({
            query: { id: artistId || '', limit: SIMILAR_LIMIT },
            serverId: server?.id,
        }),
        enabled: Boolean(server?.id && artistId),
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
        (e: MouseEvent<HTMLButtonElement>) => {
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

    const artistDetail = detailQuery.data;
    const artistInfo = infoQuery.data;
    const biography = artistInfo?.biography || artistDetail?.biography;
    const sanitizedBiography = biography ? sanitize(biography) : '';
    const artistImageUrl = artistInfo?.imageUrl || artistDetail?.imageUrl;
    const artistImageId = artistDetail?.imageId ?? artist?.imageId;
    const artistName = artistDetail?.name || artist?.name || '';
    const artistRoute = artistId
        ? generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, { albumArtistId: artistId })
        : undefined;
    const genres = artistDetail?.genres ?? [];
    const mbzId = artistDetail?.mbz;
    const listenBrainzUrl = getListenBrainzUrl(mbzId, artistName);
    const qobuzUrl = getQobuzUrl(artistName);
    const showExternalLinks =
        Boolean(artistName) &&
        externalLinks &&
        (lastFM || listenBrainz || musicBrainz || qobuz || spotify);
    const artistIsFavorite = Boolean(artistDetail?.userFavorite ?? artist?.userFavorite);

    const statsParts: string[] = [];
    if (artistDetail?.albumCount != null) {
        statsParts.push(t('entity.albumWithCount', { count: artistDetail.albumCount }));
    }
    if (artistDetail?.songCount != null) {
        statsParts.push(t('entity.trackWithCount', { count: artistDetail.songCount }));
    }
    if (artistDetail?.playCount != null) {
        statsParts.push(t('page.nowPlaying.plays', { count: artistDetail.playCount }));
    }
    const stats = statsParts.join(SEPARATOR_STRING);

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

    return (
        <div className={styles.scroll}>
            <Stack gap="md">
                <div className={styles.image}>
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
                </div>

                <Stack gap="xs">
                    <Group align="center" gap="xs" justify="space-between" wrap="nowrap">
                        <Text className={styles.trackTitle} fw={500} overflow="hidden">
                            {song.name}
                        </Text>
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
                    <JoinedArtists
                        artistName={song.artistName || ''}
                        artists={song.artists || []}
                        linkProps={{
                            ...JOINED_ARTISTS_MUTED_PROPS.linkProps,
                            size: 'md',
                        }}
                        rootTextProps={{
                            ...JOINED_ARTISTS_MUTED_PROPS.rootTextProps,
                            size: 'md',
                        }}
                    />
                    {song.album && (
                        <Text
                            component={Link}
                            fw={500}
                            isLink
                            isMuted
                            overflow="hidden"
                            size="md"
                            to={
                                song.albumId
                                    ? generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
                                          albumId: song.albumId,
                                      })
                                    : ''
                            }
                        >
                            {song.album}
                        </Text>
                    )}
                </Stack>

                {artistId && artistRoute && (
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
                                {stats && (
                                    <Text className={styles.artistHeroStats} fw={700} size="sm">
                                        {stats}
                                    </Text>
                                )}
                                {sanitizedBiography && (
                                    <>
                                        <Text
                                            className={clsx(styles.artistHeroBio, {
                                                [styles.artistHeroBioExpanded]: bioExpanded,
                                            })}
                                            dangerouslySetInnerHTML={{ __html: sanitizedBiography }}
                                            size="sm"
                                        />
                                        <Button
                                            classNames={{ root: styles.artistHeroMore }}
                                            onClick={() => setBioExpanded((open) => !open)}
                                            size="compact-sm"
                                            variant="transparent"
                                        >
                                            {bioExpanded
                                                ? t('page.nowPlaying.showLess')
                                                : t('page.nowPlaying.showMore')}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {genres.length > 0 && (
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
                    </Stack>
                )}

                {showExternalLinks && (
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
                    </Stack>
                )}

                {similarArtists.length > 0 && (
                    <AlbumArtistGridCarousel
                        data={similarArtists}
                        excludeIds={artistId ? [artistId] : undefined}
                        isLoading={infoQuery.isLoading}
                        rowCount={1}
                        title={t('page.albumArtistDetail.relatedArtists')}
                    />
                )}
            </Stack>
        </div>
    );
};
