import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { DiscoverItem } from '/@/renderer/features/discover/utils/lb-adapters';
import { useSettingsStore, useSettingsStoreActions } from '/@/renderer/store';
import { toast } from '/@/shared/components/toast/toast';

/**
 * Removes one suggestion from Discover for good, rather than for this session.
 *
 * The id is whatever `DiscoverItem.id` already is: a recording or artist MBID, or the
 * synthesised fallback for a track ListenBrainz could not map. Whichever it is, the same id is
 * what every adapter stamps on a future re-suggestion of the same thing, so blocking it once is
 * enough regardless of which lane surfaces it next.
 */
export function useDismissDiscoverItem() {
    const { setSettings } = useSettingsStoreActions();
    const { t } = useTranslation();

    return useCallback(
        (item: DiscoverItem) => {
            const previous = useSettingsStore.getState().general.discoverBlockedIds;

            if (previous.includes(item.id)) {
                return;
            }

            setSettings({ general: { discoverBlockedIds: [...previous, item.id] } });

            toast.info({ message: t('page.discover.dismissed', { title: item.title }) });
        },
        [setSettings, t],
    );
}
