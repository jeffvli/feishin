import { useTranslation } from 'react-i18next';

import { JellyfinAlbumFilters } from '/@/renderer/features/albums/components/jellyfin-album-filters';
import { NavidromeAlbumFilters } from '/@/renderer/features/albums/components/navidrome-album-filters';
import { SubsonicAlbumFilters } from '/@/renderer/features/albums/components/subsonic-album-filters';
import { FilterButton } from '/@/renderer/features/shared/components/filter-button';
import { JellyfinSongFilters } from '/@/renderer/features/songs/components/jellyfin-song-filters';
import { NavidromeSongFilters } from '/@/renderer/features/songs/components/navidrome-song-filters';
import { SubsonicSongFilters } from '/@/renderer/features/songs/components/subsonic-song-filter';
import { useCurrentServer } from '/@/renderer/store';
import { Modal } from '/@/shared/components/modal/modal';
import { useDisclosure } from '/@/shared/hooks/use-disclosure';
import { LibraryItem, ServerType } from '/@/shared/types/domain-types';

interface ListFiltersProps {
    isActive?: boolean;
    itemType: LibraryItem;
}

export const ListFilters = ({ isActive, itemType }: ListFiltersProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();

    const serverType = server.type;

    const FilterComponent = FILTERS[serverType][itemType];

    const [isOpen, handlers] = useDisclosure(false);

    return (
        <>
            <FilterButton isActive={isActive} onClick={handlers.toggle} />
            <Modal
                handlers={handlers}
                opened={isOpen}
                title={t('common.filters', { postProcess: 'sentenceCase' })}
            >
                <FilterComponent />
            </Modal>
        </>
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
