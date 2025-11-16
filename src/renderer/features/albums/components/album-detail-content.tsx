import { useQuery } from '@tanstack/react-query';
import { Suspense, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link, useParams } from 'react-router';

import styles from './album-detail-content.module.css';

import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { AlbumInfiniteCarousel } from '/@/renderer/features/albums/components/album-infinite-carousel';
import { LibraryBackgroundOverlay } from '/@/renderer/features/shared/components/library-background-overlay';
import { PlayButton } from '/@/renderer/features/shared/components/play-button';
import { useContainerQuery } from '/@/renderer/hooks';
import { useGenreRoute } from '/@/renderer/hooks/use-genre-route';
import { useCurrentServer } from '/@/renderer/store';
import { useGeneralSettings, usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { replaceURLWithHTMLLinks } from '/@/renderer/utils/linkify';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Spoiler } from '/@/shared/components/spoiler/spoiler';
import { Stack } from '/@/shared/components/stack/stack';
import { AlbumListSort, SortOrder } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

interface AlbumDetailContentProps {
    background?: string;
}

export const AlbumDetailContent = ({ background }: AlbumDetailContentProps) => {
    const { t } = useTranslation();
    const { albumId } = useParams() as { albumId: string };
    const server = useCurrentServer();
    const detailQuery = useQuery(
        albumQueries.detail({ query: { id: albumId }, serverId: server.id }),
    );

    const { data: detail } = useQuery(
        albumQueries.detail({ query: { id: albumId }, serverId: server.id }),
    );

    const cq = useContainerQuery();
    const { externalLinks, lastFM, musicBrainz } = useGeneralSettings();
    const genreRoute = useGenreRoute();

    const carousels = useMemo(
        () => [
            {
                excludeIds: detail?.id ? [detail.id] : undefined,
                isHidden: !detail?.albumArtists?.[0]?.id,
                query: {
                    _custom: {
                        jellyfin: {
                            ExcludeItemIds: detail?.id,
                        },
                    },
                    artistIds: detail?.albumArtists.length
                        ? [detail.albumArtists[0].id]
                        : undefined,
                },
                sortBy: AlbumListSort.YEAR,
                sortOrder: SortOrder.DESC,
                title: t('page.albumDetail.moreFromArtist', { postProcess: 'sentenceCase' }),
                uniqueId: 'moreFromArtist',
            },
            {
                excludeIds: detail?.id ? [detail.id] : undefined,
                isHidden: !detailQuery?.data?.genres?.[0],
                query: {
                    genres: detailQuery.data?.genres.length
                        ? [detailQuery.data.genres[0].id]
                        : undefined,
                },
                sortBy: AlbumListSort.RANDOM,
                sortOrder: SortOrder.ASC,
                title: `${t('page.albumDetail.moreFromGeneric', {
                    item: '',
                    postProcess: 'sentenceCase',
                })} ${detailQuery?.data?.genres?.[0]?.name}`,
                uniqueId: 'relatedGenres',
            },
        ],
        [detail?.id, detail?.albumArtists, detailQuery?.data?.genres, t],
    );
    const playButtonBehavior = usePlayButtonBehavior();

    const handlePlay = async (playType?: Play) => {};

    const handleFavorite = () => {
        if (!detailQuery?.data) return;
    };

    const showGenres = detailQuery?.data?.genres ? detailQuery?.data?.genres.length !== 0 : false;
    const comment = detailQuery?.data?.comment;

    const mbzId = detailQuery?.data?.mbzId;

    return (
        <div className={styles.contentContainer} ref={cq.ref}>
            <LibraryBackgroundOverlay backgroundColor={background} />
            <div className={styles.detailContainer}>
                <section>
                    <Group gap="sm" justify="space-between">
                        <Group>
                            <PlayButton onClick={() => handlePlay(playButtonBehavior)} />
                            <Group gap="xs">
                                <ActionIcon
                                    icon="favorite"
                                    iconProps={{
                                        fill: detailQuery?.data?.userFavorite
                                            ? 'primary'
                                            : undefined,
                                    }}
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
                    </Group>
                </section>
                {showGenres && (
                    <section>
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
                    </section>
                )}
                {externalLinks && (lastFM || musicBrainz) ? (
                    <section>
                        <Group gap="sm">
                            {lastFM && (
                                <ActionIcon
                                    component="a"
                                    href={`https://www.last.fm/music/${encodeURIComponent(
                                        detailQuery?.data?.albumArtist || '',
                                    )}/${encodeURIComponent(detailQuery.data?.name || '')}`}
                                    icon="brandLastfm"
                                    iconProps={{
                                        fill: 'default',
                                        size: 'xl',
                                    }}
                                    radius="md"
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
                                    href={`https://musicbrainz.org/release/${mbzId}`}
                                    icon="brandMusicBrainz"
                                    iconProps={{
                                        fill: 'default',
                                        size: 'xl',
                                    }}
                                    radius="md"
                                    rel="noopener noreferrer"
                                    size="md"
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
                {comment && (
                    <section>
                        <Spoiler maxHeight={75}>{replaceURLWithHTMLLinks(comment)}</Spoiler>
                    </section>
                )}

                <Stack gap="lg" mt="3rem" ref={cq.ref}>
                    {cq.height || cq.width ? (
                        <>
                            {carousels
                                .filter((c) => !c.isHidden)
                                .map((carousel) => (
                                    <Suspense
                                        fallback={<Spinner container />}
                                        key={`carousel-${carousel.uniqueId}`}
                                    >
                                        <AlbumInfiniteCarousel
                                            excludeIds={carousel.excludeIds}
                                            query={carousel.query}
                                            rowCount={1}
                                            sortBy={carousel.sortBy}
                                            sortOrder={carousel.sortOrder}
                                            title={carousel.title}
                                        />
                                    </Suspense>
                                ))}
                        </>
                    ) : null}
                </Stack>
            </div>
        </div>
    );
};
