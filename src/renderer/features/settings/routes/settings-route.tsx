import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import { requestAdministratorAccess } from '/@/renderer/features/settings/components/administrator-access-modal';
import { SettingsContent } from '/@/renderer/features/settings/components/settings-content';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { LibraryContainer } from '/@/renderer/features/shared/components/library-container';
import { AppRoute } from '/@/renderer/router/routes';
import { Flex } from '/@/shared/components/flex/flex';

const SettingsHeader = lazy(() =>
    import('/@/renderer/features/settings/components/settings-header').then((module) => ({
        default: module.SettingsHeader,
    })),
);

const SettingsRoute = () => {
    const navigate = useNavigate();
    const requested = useRef(false);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        if (requested.current) return;
        requested.current = true;

        requestAdministratorAccess(
            () => setAuthorized(true),
            () => navigate(AppRoute.HOME, { replace: true }),
        );
    }, [navigate]);

    if (!authorized) return null;

    return (
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
};

export default SettingsRoute;
