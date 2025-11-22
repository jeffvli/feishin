import { useState } from 'react';

import { SettingsContent } from '/@/renderer/features/settings/components/settings-content';
import { SettingsHeader } from '/@/renderer/features/settings/components/settings-header';
import { SettingSearchContext } from '/@/renderer/features/settings/context/search-context';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { LibraryContainer } from '/@/renderer/features/shared/components/library-container';
import { Flex } from '/@/shared/components/flex/flex';

const SettingsRoute = () => {
    const [search, setSearch] = useState('');

    return (
        <AnimatedPage>
            <SettingSearchContext.Provider value={search}>
                <LibraryContainer>
                    <Flex direction="column" h="100%" w="100%">
                        <SettingsHeader setSearch={setSearch} />
                        <SettingsContent />
                    </Flex>
                </LibraryContainer>
            </SettingSearchContext.Provider>
        </AnimatedPage>
    );
};

export default SettingsRoute;
