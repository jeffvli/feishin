import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';

import { ListContext } from '/@/renderer/context/list-context';
import { genresQueries } from '/@/renderer/features/genres/api/genres-api';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { LibraryContainer } from '/@/renderer/features/shared/components/library-container';
import { SongListContent } from '/@/renderer/features/songs/components/song-list-content';
import { SongListHeader } from '/@/renderer/features/songs/components/song-list-header';
import { useCurrentServer } from '/@/renderer/store';
import { GenreListSort, SortOrder } from '/@/shared/types/domain-types';

const TrackListRoute = () => {
    const server = useCurrentServer();
    const [searchParams] = useSearchParams();
    const { albumArtistId, genreId } = useParams();

    const pageKey = albumArtistId ? `albumArtistSong` : 'song';

    // const customFilters = useMemo(() => {
    //     const value = {
    //         ...(albumArtistId && { artistIds: [albumArtistId] }),
    //         ...(genreId && {
    //             genreIds: [genreId],
    //         }),
    //     };

    //     if (isEmpty(value)) {
    //         return undefined;
    //     }

    //     return value;
    // }, [albumArtistId, genreId]);

    const genreList = useQuery(
        genresQueries.list({
            options: {
                enabled: !!genreId,
                gcTime: 1000 * 60 * 60,
            },
            query: {
                sortBy: GenreListSort.NAME,
                sortOrder: SortOrder.ASC,
                startIndex: 0,
            },
            serverId: server?.id,
        }),
    );

    const genreTitle = useMemo(() => {
        if (!genreList.data) return '';
        const genre = genreList.data.items.find((g) => g.id === genreId);

        if (!genre) return 'Unknown';

        return genre?.name;
    }, [genreId, genreList.data]);

    const [itemCount, setItemCount] = useState<number | undefined>(undefined);

    const providerValue = useMemo(() => {
        return {
            id: albumArtistId ?? genreId,
            itemCount,
            pageKey,
            setItemCount,
        };
    }, [albumArtistId, genreId, itemCount, pageKey, setItemCount]);

    const artist = searchParams.get('artistName');
    const title = artist ? artist : genreId ? genreTitle : undefined;

    return (
        <AnimatedPage>
            <ListContext.Provider value={providerValue}>
                <LibraryContainer>
                    <SongListHeader title={title} />
                    <SongListContent />
                </LibraryContainer>
            </ListContext.Provider>
        </AnimatedPage>
    );
};

export default TrackListRoute;
