import { useTranslation } from 'react-i18next';

import {
    detectAlbumKeys,
    detectSongKeys,
} from '/@/renderer/features/key-detection/song-key-detection';
import { useCurrentServerId } from '/@/renderer/store';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { Song } from '/@/shared/types/domain-types';

const DetectKeyItem = ({ onSelect }: { onSelect: () => void }) => {
    const { t } = useTranslation();

    return (
        <ContextMenu.Item leftIcon="audioLines" onSelect={onSelect}>
            {t('page.contextMenu.detectKey')}
        </ContextMenu.Item>
    );
};

export const DetectSongKeysAction = ({ songs }: { songs: Song[] }) => (
    <DetectKeyItem onSelect={() => detectSongKeys(songs)} />
);

export const DetectAlbumKeysAction = ({ albumIds }: { albumIds: string[] }) => {
    const serverId = useCurrentServerId();

    return <DetectKeyItem onSelect={() => detectAlbumKeys(serverId, albumIds)} />;
};
