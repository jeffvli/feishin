import { useQuery } from '@tanstack/react-query';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, useParams } from 'react-router';
import { Link } from 'react-router-dom';

import styles from './dummy-album-detail-route.module.css';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { useHandleGeneralContextMenu } from '/@/renderer/features/context-menu';
import { SONG_ALBUM_PAGE } from '/@/renderer/features/context-menu/context-menu-items';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import {
    AnimatedPage,
    LibraryHeader,
    PlayButton,
    useCreateFavorite,
    useDeleteFavorite,
} from '/@/renderer/features/shared';
import { useContainerQuery, useFastAverageColor } from '/@/renderer/hooks';
import { queryClient } from '/@/renderer/lib/react-query';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { formatDurationString } from '/@/renderer/utils';
import { replaceURLWithHTMLLinks } from '/@/renderer/utils/linkify';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Center } from '/@/shared/components/center/center';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Spoiler } from '/@/shared/components/spoiler/spoiler';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem, SongDetailResponse } from '/@/shared/types/domain-types';

const DummyAlbumDetailRoute = () => {
    const cq = useContainerQuery();
    const { t } = useTranslation();

    const { albumId } = useParams() as { albumId: string };
    const server = useCurrentServer();
    const queryKey = queryKeys.songs.detail(server?.id || '', albumId);
    const detailQuery = useQuery({
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            return api.controller.getSongDetail({
                apiClientProps: { server, signal },
                query: { id: albumId },
            });
        },
        queryKey,
    });

    const { background, colorId } = useFastAverageColor({
        id: albumId,
        src: detailQuery.data?.imageUrl,
        srcLoaded: !detailQuery.isLoading,
    });
    const handlePlayQueueAdd = usePlayQueueAdd();
    const playButtonBehavior = usePlayButtonBehavior();

    const createFavoriteMutation = useCreateFavorite({});
    const deleteFavoriteMutation = useDeleteFavorite({});

    const handleFavorite = async () => {
        if (!detailQuery?.data) return;

        const wasFavorite = detailQuery.data.userFavorite;

        try {
            if (wasFavorite) {
                await deleteFavoriteMutation.mutateAsync({
                    query: {
                        id: [detailQuery.data.id],
                        type: LibraryItem.SONG,
                    },
                    serverId: detailQuery.data.serverId,
                });
            } else {
                await createFavoriteMutation.mutateAsync({
                    query: {
                        id: [detailQuery.data.id],
                        type: LibraryItem.SONG,
                    },
                    serverId: detailQuery.data.serverId,
                });
            }

            queryClient.setQueryData<SongDetailResponse>(queryKey, {
                ...detailQuery.data,
                userFavorite: !wasFavorite,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const showGenres = detailQuery?.data?.genres ? detailQuery?.data?.genres.length !== 0 : false;
    const comment = detailQuery?.data?.comment;

    const handleGeneralContextMenu = useHandleGeneralContextMenu(LibraryItem.SONG, SONG_ALBUM_PAGE);

    const handlePlay = () => {
        handlePlayQueueAdd?.({
            byItemType: {
                id: [albumId],
                type: LibraryItem.SONG,
            },
            playType: playButtonBehavior,
        });
    };

    const metadataItems = [
        {
            id: 'releaseYear',
            secondary: false,
            value: detailQuery?.data?.releaseYear,
        },
        {
            id: 'duration',
            secondary: false,
            value: detailQuery?.data?.duration && formatDurationString(detailQuery.data.duration),
        },
    ];

    return (
        <AnimatedPage key={`dummy-album-detail-${albumId}`}>
            <Stack ref={cq.ref}>
                <LibraryHeader
                    background={background}
                    imageUrl={detailQuery?.data?.imageUrl}
                    item={{ route: AppRoute.LIBRARY_SONGS, type: LibraryItem.SONG }}
                    loading={!background || colorId !== albumId}
                    title={detailQuery?.data?.name || ''}
                >
                    <Stack gap="sm">
                        <Group gap="sm">
                            {metadataItems.map((item, index) => (
                                <Fragment key={`item-${item.id}-${index}`}>
                                    {index > 0 && <Text isNoSelect>•</Text>}
                                    <Text isMuted={item.secondary}>{item.value}</Text>
                                </Fragment>
                            ))}
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
                                    size="md"
                                    to={generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                                        albumArtistId: artist.id,
                                    })}
                                    variant="subtle"
                                >
                                    {artist.name}
                                </Text>
                            ))}
                        </Group>
                    </Stack>
                </LibraryHeader>
            </Stack>
            <div className={styles.detailContainer}>
                <section>
                    <Group
                        gap="sm"
                        justify="space-between"
                    >
                        <Group>
                            <PlayButton onClick={() => handlePlay()} />
                            <ActionIcon
                                icon="favorite"
                                iconProps={{
                                    fill: detailQuery?.data?.userFavorite ? 'primary' : undefined,
                                }}
                                loading={
                                    createFavoriteMutation.isLoading ||
                                    deleteFavoriteMutation.isLoading
                                }
                                onClick={handleFavorite}
                                variant="subtle"
                            />
                            <ActionIcon
                                icon="ellipsisHorizontal"
                                onClick={(e) => {
                                    if (!detailQuery?.data) return;
                                    handleGeneralContextMenu(e, [detailQuery.data!]);
                                }}
                                variant="subtle"
                            />
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
                                    radius={0}
                                    size="compact-md"
                                    to={generatePath(AppRoute.LIBRARY_GENRES_SONGS, {
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
                {comment && (
                    <section>
                        <Spoiler maxHeight={75}>{replaceURLWithHTMLLinks(comment)}</Spoiler>
                    </section>
                )}
                <section>
                    <Center>
                        <Group mr={5}>
                            <Icon
                                fill="error"
                                icon="error"
                                size={30}
                            />
                        </Group>
                        <h2>{t('error.badAlbum', { postProcess: 'sentenceCase' })}</h2>
                    </Center>
                </section>
            </div>
        </AnimatedPage>
    );
};

export default DummyAlbumDetailRoute;
