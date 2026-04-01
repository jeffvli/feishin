import { useInfiniteQuery } from '@tanstack/react-query';
import { nanoid } from 'nanoid/non-secure';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { createSearchParams, generatePath, useNavigate } from 'react-router';

import { searchQueries } from '/@/renderer/features/search/api/search-api';
import { CollapsibleCommandGroup } from '/@/renderer/features/search/components/collapsible-command-group';
import { CommandItemSelectable } from '/@/renderer/features/search/components/command-item-selectable';
import { LibraryCommandItem } from '/@/renderer/features/search/components/library-command-item';
import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { Box } from '/@/shared/components/box/box';
import { Button } from '/@/shared/components/button/button';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem } from '/@/shared/types/domain-types';

interface SearchAlbumArtistsSectionProps {
    debouncedQuery: string;
    expanded: boolean;
    isHome: boolean;
    onSelectResult: () => void;
    onToggle: () => void;
    query: string;
}

export function SearchAlbumArtistsSection({
    debouncedQuery,
    expanded,
    isHome,
    onSelectResult,
    onToggle,
    query,
}: SearchAlbumArtistsSectionProps) {
    const navigate = useNavigate();
    const server = useCurrentServer();
    const { t } = useTranslation();

    const { data, fetchNextPage, hasNextPage, isFetched, isFetchingNextPage, isLoading } =
        useInfiniteQuery(
            searchQueries.searchAlbumArtistsInfinite({
                enabled: isHome && debouncedQuery !== '' && query !== '',
                searchTerm: debouncedQuery,
                serverId: server?.id,
            }),
        );

    const artists = data?.pages.flatMap((p) => p.albumArtists) ?? [];
    const showSection = isHome;
    const numberOfResults = hasNextPage ? `${artists.length}+` : artists.length;

    const handleGoToPage = useCallback(() => {
        navigate(
            {
                pathname: AppRoute.LIBRARY_ALBUM_ARTISTS,
                search: createSearchParams({
                    [FILTER_KEYS.SHARED.SEARCH_TERM]: debouncedQuery || query,
                }).toString(),
            },
            { state: { navigationId: nanoid() } },
        );
        onSelectResult();
    }, [debouncedQuery, navigate, onSelectResult, query]);

    if (!showSection) return null;

    return (
        <CollapsibleCommandGroup
            expanded={expanded}
            heading={t('entity.albumArtist', { count: 2, postProcess: 'titleCase' })}
            onToggle={onToggle}
            subtitle={
                isFetched ? (
                    <>
                        {query ? (
                            <Button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleGoToPage();
                                }}
                                onKeyDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                size="compact-xs"
                                variant="filled"
                                w="8rem"
                            >
                                {t('common.numberOfResults', { numberOfResults })}
                            </Button>
                        ) : null}
                    </>
                ) : undefined
            }
        >
            {isLoading ? (
                <Box p="md">
                    <Spinner container />
                </Box>
            ) : (
                <>
                    {artists.map((artist) => (
                        <CommandItemSelectable
                            key={`search-artist-${artist.id}`}
                            onSelect={() => {
                                navigate(
                                    generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                                        albumArtistId: artist.id,
                                    }),
                                );
                                onSelectResult();
                            }}
                            value={`search-artist-${artist.id}`}
                        >
                            {({ isHighlighted }) => (
                                <LibraryCommandItem
                                    disabled={artist?.albumCount === 0}
                                    id={artist.id}
                                    imageId={artist.imageId}
                                    imageUrl={artist.imageUrl}
                                    isHighlighted={isHighlighted}
                                    itemType={LibraryItem.ALBUM_ARTIST}
                                    subtitle={
                                        artist?.albumCount !== undefined &&
                                        artist?.albumCount !== null
                                            ? t('entity.albumWithCount', {
                                                  count: artist.albumCount,
                                              })
                                            : undefined
                                    }
                                    title={artist.name}
                                />
                            )}
                        </CommandItemSelectable>
                    ))}
                    {hasNextPage && (
                        <CommandItemSelectable
                            disabled={isFetchingNextPage}
                            onSelect={() => fetchNextPage()}
                            value="search-artists-load-more"
                        >
                            {() => (
                                <Text>
                                    {isFetchingNextPage ? (
                                        <Spinner />
                                    ) : (
                                        <Text size="sm">
                                            {t('action.viewMore', { postProcess: 'titleCase' })}
                                        </Text>
                                    )}
                                </Text>
                            )}
                        </CommandItemSelectable>
                    )}
                </>
            )}
        </CollapsibleCommandGroup>
    );
}
