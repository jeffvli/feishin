import { openContextModal } from '@mantine/modals';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { LibraryItem } from '/@/shared/types/domain-types';

interface ShareActionProps {
    ids: string[];
    itemType: LibraryItem;
}

export const ShareAction = ({ ids, itemType }: ShareActionProps) => {
    const { t } = useTranslation();

    const resourceType = useMemo(() => {
        switch (itemType) {
            case LibraryItem.ALBUM:
                return 'album';
            case LibraryItem.ALBUM_ARTIST:
                return 'albumArtist';
            case LibraryItem.PLAYLIST:
                return 'playlist';
            case LibraryItem.SONG:
                return 'song';
            default:
                return 'song';
        }
    }, [itemType]);

    const onSelect = useCallback(() => {
        openContextModal({
            innerProps: {
                itemIds: ids,
                resourceType,
            },
            modalKey: 'shareItem',
            title: t('page.contextMenu.shareItem', { postProcess: 'titleCase' }),
        });
    }, [ids, resourceType, t]);

    return (
        <ContextMenu.Item leftIcon="share" onSelect={onSelect}>
            {t('page.contextMenu.shareItem', { postProcess: 'sentenceCase' })}
        </ContextMenu.Item>
    );
};
