import { useQuery } from '@tanstack/react-query';

import { sharedQueries } from '/@/renderer/features/shared/api/shared-api';
import { FolderButton } from '/@/renderer/features/shared/components/folder-button';
import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { useCurrentServer } from '/@/renderer/store';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { useLocalStorage } from '/@/shared/hooks/use-local-storage';
import { ItemListKey } from '/@/shared/types/types';
import { useMusicFolderIdFilter } from '/@/renderer/features/shared/hooks/use-music-folder-id-filter';

interface ListMusicFolderDropdownProps {
    listKey: ItemListKey;
}

export const ListMusicFolderDropdown = ({ listKey }: ListMusicFolderDropdownProps) => {
    const server = useCurrentServer();
    const { data: musicFolders } = useQuery(
        sharedQueries.musicFolders({ query: null, serverId: server.id }),
    );

    const [persisted, setPersisted] = useLocalStorage({
        defaultValue: '',
        key: getPersistenceKey(server.id, listKey),
    });

    const { musicFolderId, setMusicFolderId } = useMusicFolderIdFilter(persisted);

    const handleSetMusicFolder = (e: string) => {
        if (e === musicFolderId) {
            setMusicFolderId('');
            setPersisted('');
            return;
        }

        setMusicFolderId(e);
        setPersisted(e);
    };

    return (
        <DropdownMenu position="bottom-start">
            <DropdownMenu.Target>
                <FolderButton isActive={!!musicFolderId} />
            </DropdownMenu.Target>
            <DropdownMenu.Dropdown>
                {musicFolders?.items.map((folder) => (
                    <DropdownMenu.Item
                        isSelected={musicFolderId === folder.id}
                        key={`musicFolder-${folder.id}`}
                        onClick={() => handleSetMusicFolder(folder.id)}
                        value={folder.id}
                    >
                        {folder.name}
                    </DropdownMenu.Item>
                ))}
            </DropdownMenu.Dropdown>
        </DropdownMenu>
    );
};

const getPersistenceKey = (serverId: string, listKey: ItemListKey) => {
    return `${serverId}-list-${listKey}-${FILTER_KEYS.SHARED.MUSIC_FOLDER_ID}`;
};
