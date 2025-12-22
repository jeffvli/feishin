import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { shuffle } from 'lodash';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link } from 'react-router';

import styles from './featured-genres.module.css';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { genresQueries } from '/@/renderer/features/genres/api/genres-api';
import { useIsPlayerFetching, usePlayer } from '/@/renderer/features/player/context/player-context';
import { PlayButton } from '/@/renderer/features/shared/components/play-button';
import { useContainerQuery } from '/@/renderer/hooks';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, useCurrentServerId } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import { Genre, GenreListSort, Played, SortOrder } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';
import { stringToColor } from '/@/shared/utils/string-to-color';

function getGenresToShow(breakpoints: {
    isLargerThanLg: boolean;
    isLargerThanMd: boolean;
    isLargerThanSm: boolean;
    isLargerThanXl: boolean;
    isLargerThanXxl: boolean;
    isLargerThanXxxl: boolean;
}) {
    if (breakpoints.isLargerThanXxxl) {
        return 42;
    }

    if (breakpoints.isLargerThanXxl) {
        return 30;
    }

    if (breakpoints.isLargerThanXl) {
        return 24;
    }

    if (breakpoints.isLargerThanLg) {
        return 18;
    }

    if (breakpoints.isLargerThanMd) {
        return 12;
    }

    if (breakpoints.isLargerThanSm) {
        return 9;
    }

    return 6;
}

export const FeaturedGenres = () => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const { ref, ...cq } = useContainerQuery({
        lg: 900,
        md: 600,
        sm: 360,
    });

    const genresQuery = useSuspenseQuery({
        ...genresQueries.list({
            query: {
                limit: -1,
                sortBy: GenreListSort.NAME,
                sortOrder: SortOrder.ASC,
                startIndex: 0,
            },
            serverId: server?.id,
        }),
        queryKey: [server.id, 'home', 'featured-genres'],
    });

    const randomGenres = useMemo(() => {
        if (!genresQuery.data?.items) return [];
        return shuffle(genresQuery.data.items);
    }, [genresQuery.data]);

    const genresToShow = useMemo(() => {
        return getGenresToShow({
            isLargerThanLg: cq.isLg,
            isLargerThanMd: cq.isMd,
            isLargerThanSm: cq.isSm,
            isLargerThanXl: cq.isXl,
            isLargerThanXxl: cq.is2xl,
            isLargerThanXxxl: cq.is3xl,
        });
    }, [cq.isLg, cq.isMd, cq.isSm, cq.isXl, cq.is2xl, cq.is3xl]);

    const visibleGenres = useMemo(() => {
        return randomGenres.slice(0, genresToShow);
    }, [randomGenres, genresToShow]);

    const genresWithColors = useMemo(() => {
        if (!visibleGenres) return [];

        return visibleGenres.map((genre: Genre) => {
            const { color, isLight } = stringToColor(genre.name);
            const path = generatePath(AppRoute.LIBRARY_GENRES_DETAIL, { genreId: genre.id });

            return {
                ...genre,
                color,
                isLight,
                path,
            };
        });
    }, [visibleGenres]);

    return (
        <div className={styles.container} ref={ref}>
            {cq.isCalculated && (
                <>
                    <Group align="flex-end" justify="space-between">
                        <TextTitle fw={700} isNoSelect order={3}>
                            {t('entity.genre_other', { postProcess: 'titleCase' })}
                        </TextTitle>
                        <Button
                            component={Link}
                            size="compact-sm"
                            to={AppRoute.LIBRARY_GENRES}
                            variant="subtle"
                        >
                            {t('action.viewMore', { postProcess: 'sentenceCase' })}
                        </Button>
                    </Group>
                    <div className={styles.grid}>
                        {genresWithColors.map((genre) => (
                            <GenreItem genre={genre} key={genre.id} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const GenrePlayButton = ({ genre }: { genre: Genre }) => {
    const queryClient = useQueryClient();
    const isPlayerFetching = useIsPlayerFetching();
    const player = usePlayer();
    const serverId = useCurrentServerId();

    const handlePlay = useCallback(
        async (genre: Genre) => {
            if (!serverId) return;

            const data = await queryClient.fetchQuery({
                gcTime: 0,
                queryFn: () => {
                    return api.controller.getRandomSongList({
                        apiClientProps: { serverId },
                        query: {
                            genre: genre.id,
                            limit: 100,
                            played: Played.All,
                        },
                    });
                },
                queryKey: queryKeys.player.fetch(),
                staleTime: 0,
            });

            player.addToQueueByData(data?.items || [], Play.NOW);
        },
        [player, queryClient, serverId],
    );

    return (
        <span className={styles.playButtonWrapper}>
            <PlayButton
                fill={true}
                isSecondary
                loading={isPlayerFetching}
                onClick={() => handlePlay(genre)}
            />
        </span>
    );
};

const GenreItem = memo(({ genre }: { genre: Genre & { color: string; path: string } }) => {
    return (
        <div
            className={styles.genreContainer}
            key={genre.id}
            style={
                {
                    '--genre-color': genre.color,
                } as React.CSSProperties
            }
        >
            <Link className={styles.genreLink} state={{ item: genre }} to={genre.path}>
                <span className={styles.genreName}>{genre.name}</span>
                <GenrePlayButton genre={genre} />
            </Link>
        </div>
    );
});

GenreItem.displayName = 'GenreItem';
