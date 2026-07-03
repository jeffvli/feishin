import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { useListContext } from '/@/renderer/context/list-context';
import { AlbumListHeaderFilters } from '/@/renderer/features/albums/components/album-list-header-filters';
import { useAlbumListFilters } from '/@/renderer/features/albums/hooks/use-album-list-filters';
import { FilterBar } from '/@/renderer/features/shared/components/filter-bar';
import { LibraryHeaderBar } from '/@/renderer/features/shared/components/library-header-bar';
import { ListSearchInput } from '/@/renderer/features/shared/components/list-search-input';
import { SongListHeaderFilters } from '/@/renderer/features/songs/components/song-list-header-filters';
import { useSongListFilters } from '/@/renderer/features/songs/hooks/use-song-list-filters';
import { GenreTarget, useGenreTarget } from '/@/renderer/store';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { LibraryItem } from '/@/shared/types/domain-types';

interface GenreDetailHeaderProps {
    title?: string;
}

export const GenreDetailHeader = ({ title }: GenreDetailHeaderProps) => {
    const { t } = useTranslation();

    const { itemCount } = useListContext();
    const pageTitle = title || t('page.genreList.title');

    const genreTarget = useGenreTarget();

    return (
        <Stack gap={0}>
            <PageHeader>
                <LibraryHeaderBar ignoreMaxWidth>
                    <PlayButton />
                    <LibraryHeaderBar.Title>{pageTitle}</LibraryHeaderBar.Title>
                    <LibraryHeaderBar.Badge isLoading={!itemCount}>
                        {itemCount}
                    </LibraryHeaderBar.Badge>
                </LibraryHeaderBar>
                <Group>
                    <ListSearchInput />
                </Group>
            </PageHeader>
            <FilterBar>
                {genreTarget === GenreTarget.ALBUM ? (
                    <AlbumListHeaderFilters toggleGenreTarget />
                ) : (
                    <SongListHeaderFilters toggleGenreTarget />
                )}
            </FilterBar>
        </Stack>
    );
};

const PlayButton = () => {
    const genreTarget = useGenreTarget();

    switch (genreTarget) {
        case GenreTarget.ALBUM:
            return <AlbumPlayButton />;
        case GenreTarget.TRACK:
            return <SongPlayButton />;
        default:
            return null;
    }
};

const AlbumPlayButton = () => {
    const { query } = useAlbumListFilters();
    const { id } = useListContext();

    const mergedQuery = useMemo(() => {
        return {
            ...query,
            genreIds: [id],
        };
    }, [query, id]);

    return (
        <LibraryHeaderBar.PlayButton
            itemType={LibraryItem.ALBUM}
            listQuery={mergedQuery}
            variant="filled"
        />
    );
};

const SongPlayButton = () => {
    const { query } = useSongListFilters();
    const { id } = useListContext();

    const mergedQuery = useMemo(() => {
        return {
            ...query,
            genreIds: [id],
        };
    }, [query, id]);

    return (
        <LibraryHeaderBar.PlayButton
            itemType={LibraryItem.SONG}
            listQuery={mergedQuery}
            variant="filled"
        />
    );
};
