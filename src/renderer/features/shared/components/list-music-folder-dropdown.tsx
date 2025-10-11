import { useLocalStorage } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { parseAsString, useQueryState } from 'nuqs';

import { sharedQueries } from '/@/renderer/features/shared/api/shared-api';
import { FolderButton } from '/@/renderer/features/shared/components/folder-button';
import { useCurrentServer } from '/@/renderer/store';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { ItemListKey } from '/@/shared/types/types';

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
        key: getPersistenceKey(listKey),
    });

    const [musicFolderId, setMusicFolderId] = useQueryState(
        getPersistenceKey(listKey),
        parseAsString.withDefault(persisted || ''),
    );

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

const getPersistenceKey = (listKey: ItemListKey) => {
    return `list-${listKey}-musicFolder`;
};
