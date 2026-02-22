import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import { useListContext } from '/@/renderer/context/list-context';
import { JellyfinAlbumFilters } from '/@/renderer/features/albums/components/jellyfin-album-filters';
import { NavidromeAlbumFilters } from '/@/renderer/features/albums/components/navidrome-album-filters';
import { SubsonicAlbumFilters } from '/@/renderer/features/albums/components/subsonic-album-filters';
import { useAlbumListFilters } from '/@/renderer/features/albums/hooks/use-album-list-filters';
import { ComponentErrorBoundary } from '/@/renderer/features/shared/components/component-error-boundary';
import { FilterButton } from '/@/renderer/features/shared/components/filter-button';
import { SaveAsCollectionButton } from '/@/renderer/features/shared/components/save-as-collection-button';
import { JellyfinSongFilters } from '/@/renderer/features/songs/components/jellyfin-song-filters';
import { NavidromeSongFilters } from '/@/renderer/features/songs/components/navidrome-song-filters';
import { SubsonicSongFilters } from '/@/renderer/features/songs/components/subsonic-song-filters';
import { useSongListFilters } from '/@/renderer/features/songs/hooks/use-song-list-filters';
import { useCurrentServer } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Modal } from '/@/shared/components/modal/modal';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { useDisclosure } from '/@/shared/hooks/use-disclosure';
import { LibraryItem, ServerType } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

interface ListFiltersProps {
    isActive?: boolean;
    itemType: LibraryItem;
}

export const isFilterValueSet = (value: unknown): boolean => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === 'object' && Object.keys(value).length === 0) return false;
    return true;
};

export const ListFiltersModal = ({ isActive, itemType }: ListFiltersProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const { isSidebarOpen, pageKey, setIsSidebarOpen } = useListContext();

    const serverType = server.type;

    const FilterComponent = FILTERS[serverType][itemType];

    const [isOpen, handlers] = useDisclosure(false);

    const albumListFilters = useAlbumListFilters(pageKey as ItemListKey);
    const songListFilters = useSongListFilters(pageKey as ItemListKey);
    const clear = itemType === LibraryItem.ALBUM ? albumListFilters.clear : songListFilters.clear;

    const handlePin = () => {
        setIsSidebarOpen?.(!isSidebarOpen);
    };

    const handleReset = () => {
        clear();
    };

    const canPin = Boolean(setIsSidebarOpen);

    const disableArtistFilter = pageKey === ItemListKey.ALBUM_ARTIST_ALBUM;
    const disableGenreFilter =
        pageKey === ItemListKey.GENRE_ALBUM || pageKey === ItemListKey.GENRE_SONG;

    return (
        <>
            <FilterButton isActive={isActive} onClick={handlers.toggle} />
            <Modal
                handlers={handlers}
                opened={isOpen}
                size="lg"
                styles={{
                    content: {
                        height: '100%',
                        maxHeight: '640px',
                        maxWidth: 'var(--theme-content-max-width)',
                        width: '100%',
                    },
                }}
                title={
                    <Group justify="space-between" style={{ paddingRight: '3rem', width: '100%' }}>
                        <Group>
                            {canPin && (
                                <ActionIcon
                                    icon={isSidebarOpen ? 'unpin' : 'pin'}
                                    onClick={handlePin}
                                    variant="subtle"
                                />
                            )}

                            {t('common.filters', { postProcess: 'sentenceCase' })}
                        </Group>
                        <Button onClick={handleReset} size="compact-sm" variant="subtle">
                            {t('common.reset', { postProcess: 'sentenceCase' })}
                        </Button>
                    </Group>
                }
            >
                <FilterComponent
                    disableArtistFilter={disableArtistFilter}
                    disableGenreFilter={disableGenreFilter}
                />
                <Stack p="md">
                    <SaveAsCollectionButton
                        fullWidth
                        itemType={itemType as LibraryItem.ALBUM | LibraryItem.SONG}
                    />
                </Stack>
            </Modal>
        </>
    );
};

export const ListFilters = ({ itemType }: ListFiltersProps) => {
    const server = useCurrentServer();
    const serverType = server.type;
    const FilterComponent = FILTERS[serverType][itemType];
    const { pageKey } = useListContext();

    const disableArtistFilter = pageKey === ItemListKey.ALBUM_ARTIST_ALBUM;
    const disableGenreFilter =
        pageKey === ItemListKey.GENRE_ALBUM || pageKey === ItemListKey.GENRE_SONG;

    return (
        <ComponentErrorBoundary>
            <Suspense fallback={<Spinner container />}>
                <FilterComponent
                    disableArtistFilter={disableArtistFilter}
                    disableGenreFilter={disableGenreFilter}
                />
            </Suspense>
        </ComponentErrorBoundary>
    );
};

interface ListFiltersTitleProps {
    itemType: LibraryItem;
}

export const ListFiltersTitle = ({ itemType }: ListFiltersTitleProps) => {
    const { t } = useTranslation();
    const { pageKey, setIsSidebarOpen } = useListContext();

    const handleUnpin = () => {
        setIsSidebarOpen?.(false);
    };

    const canUnpin = Boolean(setIsSidebarOpen);

    const albumListFilters = useAlbumListFilters(pageKey as ItemListKey);
    const songListFilters = useSongListFilters(pageKey as ItemListKey);
    const clear = itemType === LibraryItem.ALBUM ? albumListFilters.clear : songListFilters.clear;

    return (
        <Group justify="space-between" pb={0} pl="md" pr="md" pt="md">
            <Text fw={500} size="xl">
                {t('common.filters', { postProcess: 'sentenceCase' })}
            </Text>
            <Group gap="xs">
                <Button onClick={clear} size="compact-sm" variant="subtle">
                    {t('common.reset', { postProcess: 'sentenceCase' })}
                </Button>
                {canUnpin && (
                    <ActionIcon
                        icon="unpin"
                        onClick={handleUnpin}
                        size="compact-sm"
                        variant="subtle"
                    />
                )}
            </Group>
        </Group>
    );
};

const FILTERS = {
    [ServerType.JELLYFIN]: {
        [LibraryItem.ALBUM]: JellyfinAlbumFilters,
        [LibraryItem.SONG]: JellyfinSongFilters,
    },
    [ServerType.NAVIDROME]: {
        [LibraryItem.ALBUM]: NavidromeAlbumFilters,
        [LibraryItem.SONG]: NavidromeSongFilters,
    },
    [ServerType.SUBSONIC]: {
        [LibraryItem.ALBUM]: SubsonicAlbumFilters,
        [LibraryItem.SONG]: SubsonicSongFilters,
    },
};
