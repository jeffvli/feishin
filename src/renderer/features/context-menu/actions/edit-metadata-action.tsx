import { openContextModal } from '@mantine/modals';
import isElectron from 'is-electron';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { Song } from '/@/shared/types/domain-types';

interface EditMetadataActionProps {
    albumIds?: string[];
    songs?: Song[];
}

const utils = isElectron() ? window.api.utils : null;

export const EditMetadataAction = ({ albumIds, songs: songItems }: EditMetadataActionProps) => {
    const { t } = useTranslation();
    const songs = useMemo(() => songItems?.filter((s) => s.path) ?? [], [songItems]);
    const count = albumIds?.length ?? songs.length;

    const onSelect = useCallback(() => {
        openContextModal({
            innerProps: { albumIds, songs },
            modal: 'editMetadata',
            size: 'xl',
            styles: { body: { paddingBottom: 'var(--theme-spacing-xl)' } },
            title: t('page.contextMenu.editMetadata'),
        });
    }, [albumIds, songs, t]);

    if (!utils) return null;

    return (
        <ContextMenu.Item disabled={count === 0} leftIcon="edit" onSelect={onSelect}>
            {t('page.contextMenu.editMetadata')}
        </ContextMenu.Item>
    );
};
