import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router';

import styles from './search-content.module.css';

import { ItemTableList } from '/@/renderer/components/item-list/item-table-list/item-table-list';
import { ItemTableListColumn } from '/@/renderer/components/item-list/item-table-list/item-table-list-column';
import { ItemTableListColumnConfig } from '/@/renderer/components/item-list/types';
import { searchQueries } from '/@/renderer/features/search/api/search-api';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { useCurrentServer, usePlayerSong } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { LibraryItem } from '/@/shared/types/domain-types';
import { TableColumn } from '/@/shared/types/types';

const SONG_PAGE_SIZE = 25;
const SEARCH_RESULT_COLUMNS: ItemTableListColumnConfig[] = [
    {
        align: 'center',
        id: TableColumn.IMAGE,
        isEnabled: true,
        pinned: 'left',
        width: 64,
    },
    {
        align: 'start',
        autoSize: true,
        id: TableColumn.TITLE_ARTIST,
        isEnabled: true,
        pinned: null,
        width: 360,
    },
    {
        align: 'start',
        id: TableColumn.ALBUM,
        isEnabled: true,
        pinned: null,
        width: 280,
    },
    {
        align: 'end',
        id: TableColumn.DURATION,
        isEnabled: true,
        pinned: null,
        width: 100,
    },
];

export const SearchContent = () => {
    const [searchParams] = useSearchParams();
    const server = useCurrentServer();
    const currentSong = usePlayerSong();
    const searchTerm = (searchParams.get('query') || '').trim();

    const artistMatchesQuery = useQuery(
        searchQueries.search({
            options: { enabled: Boolean(searchTerm) },
            query: {
                albumArtistLimit: 20,
                albumArtistStartIndex: 0,
                albumLimit: 0,
                albumStartIndex: 0,
                query: searchTerm,
                songLimit: 0,
                songStartIndex: 0,
            },
            serverId: server?.id,
        }),
    );
    const matchingArtistIds = useMemo(() => {
        const matches = artistMatchesQuery.data?.albumArtists ?? [];
        const normalizedSearchTerm = searchTerm.toLocaleLowerCase();
        const exactMatches = matches.filter(
            (artist) => artist.name.toLocaleLowerCase() === normalizedSearchTerm,
        );
        return (exactMatches.length > 0 ? exactMatches : matches).map((artist) => artist.id);
    }, [artistMatchesQuery.data?.albumArtists, searchTerm]);
    const titleSongsQuery = useInfiniteQuery(
        searchQueries.searchSongsInfinite({
            enabled: Boolean(searchTerm),
            pageSize: SONG_PAGE_SIZE,
            searchTerm,
            serverId: server?.id,
        }),
    );
    const artistSongsQuery = useInfiniteQuery(
        searchQueries.searchArtistSongsInfinite({
            artistIds: matchingArtistIds,
            enabled: artistMatchesQuery.isSuccess,
            pageSize: SONG_PAGE_SIZE,
            searchTerm,
            serverId: server?.id,
        }),
    );

    const songs = useMemo(() => {
        const titleMatches = titleSongsQuery.data?.pages.flatMap((page) => page.songs) ?? [];
        const artistMatches = artistSongsQuery.data?.pages.flatMap((page) => page.items) ?? [];
        return [
            ...new Map([...titleMatches, ...artistMatches].map((song) => [song.id, song])).values(),
        ];
    }, [artistSongsQuery.data?.pages, titleSongsQuery.data?.pages]);
    const loading =
        artistMatchesQuery.isLoading ||
        titleSongsQuery.isLoading ||
        (matchingArtistIds.length > 0 && artistSongsQuery.isLoading);
    const hasMoreTracks = titleSongsQuery.hasNextPage || artistSongsQuery.hasNextPage;

    const loadMoreTracks = async () => {
        await Promise.all([
            titleSongsQuery.hasNextPage ? titleSongsQuery.fetchNextPage() : Promise.resolve(),
            artistSongsQuery.hasNextPage ? artistSongsQuery.fetchNextPage() : Promise.resolve(),
        ]);
    };

    return (
        <AnimatedPage>
            <main className={styles.container}>
                {!searchTerm ? (
                    <div className={styles.emptyState}>
                        Use the search bar above to find tracks by title or artist.
                    </div>
                ) : loading ? (
                    <Spinner container />
                ) : songs.length === 0 ? (
                    <div className={styles.emptyState}>No tracks found for “{searchTerm}”.</div>
                ) : (
                    <>
                        <h1 className={styles.pageTitle}>Search results for “{searchTerm}”</h1>
                        <section aria-labelledby="search-tracks-heading">
                            <div className={styles.sectionHeader}>
                                <h2 id="search-tracks-heading">Tracks</h2>
                                {hasMoreTracks && (
                                    <Button
                                        loading={
                                            titleSongsQuery.isFetchingNextPage ||
                                            artistSongsQuery.isFetchingNextPage
                                        }
                                        onClick={loadMoreTracks}
                                        size="compact-sm"
                                        variant="subtle"
                                    >
                                        Show more tracks
                                    </Button>
                                )}
                            </div>
                            <div className={styles.trackTable}>
                                <ItemTableList
                                    activeRowId={currentSong?.id}
                                    autoFitColumns
                                    CellComponent={ItemTableListColumn}
                                    columns={SEARCH_RESULT_COLUMNS}
                                    data={songs}
                                    enableExpansion={false}
                                    enableHeader
                                    enableSelection
                                    itemType={LibraryItem.SONG}
                                    size="default"
                                />
                            </div>
                        </section>
                    </>
                )}
            </main>
        </AnimatedPage>
    );
};
