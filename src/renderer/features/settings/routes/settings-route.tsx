import { lazy, Suspense } from 'react';

import { SettingsContent } from '/@/renderer/features/settings/components/settings-content';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { LibraryContainer } from '/@/renderer/features/shared/components/library-container';
import { Flex } from '/@/shared/components/flex/flex';

const SettingsHeader = lazy(() =>
    import('/@/renderer/features/settings/components/settings-header').then((module) => ({
        default: module.SettingsHeader,
    })),
);

const SettingsRoute = () => (
    <AnimatedPage>
        <LibraryContainer>
            <Flex direction="column" h="100%" w="100%">
                <Suspense fallback={<></>}>
                    <SettingsHeader />
                </Suspense>
                <SettingsContent />
            </Flex>
        </LibraryContainer>
    </AnimatedPage>
);

export default SettingsRoute;
