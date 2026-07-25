import { useState } from 'react';

import { SettingsContent } from '/@/renderer/features/settings/components/settings-content';
import { SettingsHeader } from '/@/renderer/features/settings/components/settings-header';
import { SettingSearchContext } from '/@/renderer/features/settings/context/search-context';

export const SettingsContextModal = () => {
    const [search, setSearch] = useState('');

    return (
        <SettingSearchContext.Provider value={search}>
            <SettingsHeader setSearch={setSearch} showUpdateAvailable />
            <SettingsContent />
        </SettingSearchContext.Provider>
    );
};
