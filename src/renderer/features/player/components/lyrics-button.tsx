import { useTranslation } from 'react-i18next';

import {
    useFullScreenPlayerStore,
    useFullScreenPlayerStoreActions,
    useSetFullScreenPlayerStore,
} from '/@/renderer/store/full-screen-player.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';

export const LyricsButton = () => {
    const { t } = useTranslation();
    const setFullScreenPlayerStore = useSetFullScreenPlayerStore();
    const activeTab = useFullScreenPlayerStore((state) => state.activeTab);
    const { setStore } = useFullScreenPlayerStoreActions();
    const { expanded: isFullScreenPlayerExpanded } = useFullScreenPlayerStore();
    return (
        <ActionIcon
            icon="microphone"
            iconProps={{
                color: activeTab === 'lyrics' && isFullScreenPlayerExpanded ? 'primary' : undefined,
                size: 'lg',
            }}
            onClick={(e) => {
                e.stopPropagation();
                if (!isFullScreenPlayerExpanded) setStore({ activeTab: 'lyrics' });
                setFullScreenPlayerStore({ expanded: !isFullScreenPlayerExpanded });
            }}
            role="button"
            size="sm"
            tooltip={{ label: t('player.lyrics', { postProcess: 'titleCase' }), openDelay: 0 }}
            variant="subtle"
        />
    );
};
