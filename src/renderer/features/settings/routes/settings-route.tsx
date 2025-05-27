import { useState } from 'react';

import { SettingsContent } from '/@/renderer/features/settings/components/settings-content';
import { SettingsHeader } from '/@/renderer/features/settings/components/settings-header';
import { SettingSearchContext } from '/@/renderer/features/settings/context/search-context';
import { AnimatedPage } from '/@/renderer/features/shared';
import { Flex } from '/@/shared/components/flex/flex';

const SettingsRoute = () => {
    const [search, setSearch] = useState('');

    return (
        <AnimatedPage>
            <SettingSearchContext.Provider value={search}>
                <Flex
                    direction="column"
                    h="100%"
                    w="100%"
                >
                    <SettingsHeader setSearch={setSearch} />
                    <SettingsContent />
                </Flex>
            </SettingSearchContext.Provider>
        </AnimatedPage>
    );
};

export default SettingsRoute;
