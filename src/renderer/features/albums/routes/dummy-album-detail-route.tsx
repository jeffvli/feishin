import { Button, Center, Group, Spinner, Spoiler, Stack, Text } from '/@/renderer/components';
import {
    AnimatedPage,
    LibraryHeader,
    PlayButton,
    useCreateFavorite,
    useDeleteFavorite,
} from '/@/renderer/features/shared';
import { Fragment } from 'react';
import { generatePath, useParams } from 'react-router';
import { useContainerQuery, useFastAverageColor } from '/@/renderer/hooks';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { LibraryItem, SongDetailResponse } from '/@/renderer/api/types';
import { useCurrentServer } from '/@/renderer/store';
import { Link } from 'react-router-dom';
import { AppRoute } from '/@/renderer/router/routes';
import { formatDurationString } from '/@/renderer/utils';
import { RiErrorWarningLine, RiHeartFill, RiHeartLine, RiMoreFill } from 'react-icons/ri';
import { replaceURLWithHTMLLinks } from '/@/renderer/utils/linkify';
import { SONG_ALBUM_PAGE } from '/@/renderer/features/context-menu/context-menu-items';
import { useHandleGeneralContextMenu } from '/@/renderer/features/context-menu';
import { styled } from 'styled-components';
import { queryClient } from '/@/renderer/lib/react-query';
import { useQuery } from '@tanstack/react-query';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { useTranslation } from 'react-i18next';

const DetailContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 1rem 2rem 5rem;
    overflow: hidden;
`;

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

    const { color: background, colorId } = useFastAverageColor({
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

    if (!background || colorId !== albumId) {
        return <Spinner container />;
    }

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
                    title={detailQuery?.data?.name || ''}
                >
                    <Stack gap="sm">
                        <Group gap="sm">
                            {metadataItems.map((item, index) => (
                                <Fragment key={`item-${item.id}-${index}`}>
                                    {index > 0 && <Text $noSelect>•</Text>}
                                    <Text $secondary={item.secondary}>{item.value}</Text>
                                </Fragment>
                            ))}
                        </Group>
                        <Group
                            gap="md"
                            style={{
                                WebkitBoxOrient: 'vertical',
                                WebkitLineClamp: 2,
                                maxHeight: '4rem',
                                overflow: 'hidden',
                            }}
                        >
                            {detailQuery?.data?.albumArtists.map((artist) => (
                                <Text
                                    key={`artist-${artist.id}`}
                                    $link
                                    component={Link}
                                    fw={600}
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
            <DetailContainer>
                <section>
                    <Group
                        gap="sm"
                        justify="space-between"
                    >
                        <Group>
                            <PlayButton onClick={() => handlePlay()} />
                            <Button
                                loading={
                                    createFavoriteMutation.isLoading ||
                                    deleteFavoriteMutation.isLoading
                                }
                                size="compact-md"
                                variant="subtle"
                                onClick={handleFavorite}
                            >
                                {detailQuery?.data?.userFavorite ? (
                                    <RiHeartFill
                                        color="red"
                                        size={20}
                                    />
                                ) : (
                                    <RiHeartLine size={20} />
                                )}
                            </Button>
                            <Button
                                size="compact-md"
                                variant="subtle"
                                onClick={(e) => {
                                    if (!detailQuery?.data) return;
                                    handleGeneralContextMenu(e, [detailQuery.data!]);
                                }}
                            >
                                <RiMoreFill size={20} />
                            </Button>
                        </Group>
                    </Group>
                </section>
                {showGenres && (
                    <section>
                        <Group gap="sm">
                            {detailQuery?.data?.genres?.map((genre) => (
                                <Button
                                    key={`genre-${genre.id}`}
                                    component={Link}
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
                        <Group style={{ marginRight: '5px' }}>
                            <RiErrorWarningLine
                                color="var(--danger-color)"
                                size={30}
                            />
                        </Group>
                        <h2>{t('error.badAlbum', { postProcess: 'sentenceCase' })}</h2>
                    </Center>
                </section>
            </DetailContainer>
        </AnimatedPage>
    );
};

export default DummyAlbumDetailRoute;
