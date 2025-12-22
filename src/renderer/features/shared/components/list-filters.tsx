import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import { useListContext } from '/@/renderer/context/list-context';
import { JellyfinAlbumFilters } from '/@/renderer/features/albums/components/jellyfin-album-filters';
import { NavidromeAlbumFilters } from '/@/renderer/features/albums/components/navidrome-album-filters';
import { SubsonicAlbumFilters } from '/@/renderer/features/albums/components/subsonic-album-filters';
import { ComponentErrorBoundary } from '/@/renderer/features/shared/components/component-error-boundary';
import { FilterButton } from '/@/renderer/features/shared/components/filter-button';
import { JellyfinSongFilters } from '/@/renderer/features/songs/components/jellyfin-song-filters';
import { NavidromeSongFilters } from '/@/renderer/features/songs/components/navidrome-song-filters';
import { SubsonicSongFilters } from '/@/renderer/features/songs/components/subsonic-song-filters';
import { useCurrentServer } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Group } from '/@/shared/components/group/group';
import { Modal } from '/@/shared/components/modal/modal';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Text } from '/@/shared/components/text/text';
import { useDisclosure } from '/@/shared/hooks/use-disclosure';
import { LibraryItem, ServerType } from '/@/shared/types/domain-types';

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
    const { isSidebarOpen, setIsSidebarOpen } = useListContext();

    const serverType = server.type;

    const FilterComponent = FILTERS[serverType][itemType];

    const [isOpen, handlers] = useDisclosure(false);

    const handlePin = () => {
        setIsSidebarOpen?.(!isSidebarOpen);
    };

    const canPin = Boolean(setIsSidebarOpen);

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
                }
            >
                <FilterComponent />
            </Modal>
        </>
    );
};

export const ListFilters = ({ itemType }: ListFiltersProps) => {
    const server = useCurrentServer();
    const serverType = server.type;
    const FilterComponent = FILTERS[serverType][itemType];

    return (
        <ComponentErrorBoundary>
            <Suspense fallback={<Spinner container />}>
                <FilterComponent />
            </Suspense>
        </ComponentErrorBoundary>
    );
};

export const ListFiltersTitle = () => {
    const { t } = useTranslation();
    const { setIsSidebarOpen } = useListContext();

    const handleUnpin = () => {
        setIsSidebarOpen?.(false);
    };

    const canUnpin = Boolean(setIsSidebarOpen);

    return (
        <Group justify="space-between" pb={0} pl="md" pr="md" pt="md">
            <Text fw={500} size="xl">
                {t('common.filters', { postProcess: 'sentenceCase' })}
            </Text>
            {canUnpin && <ActionIcon icon="unpin" onClick={handleUnpin} variant="subtle" />}
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
