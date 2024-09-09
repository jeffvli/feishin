import { Flex } from '@mantine/core';
import { SettingsContent } from '/@/renderer/features/settings/components/settings-content';
import { SettingsHeader } from '/@/renderer/features/settings/components/settings-header';
import { AnimatedPage } from '/@/renderer/features/shared';
import { SettingSearchContext } from '/@/renderer/features/settings/context/search-context';
import { useState } from 'react';

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
