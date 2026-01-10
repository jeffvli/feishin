import isElectron from 'is-electron';
import { useNavigate } from 'react-router';

import { useAppTracker } from '/@/renderer/features/analytics/hooks/use-app-tracker';
import { CommandPalette } from '/@/renderer/features/search/components/command-palette';
import { useGarbageCollection } from '/@/renderer/hooks/use-garbage-collection';
import { useIsMobile } from '/@/renderer/hooks/use-is-mobile';
import { DefaultLayout } from '/@/renderer/layouts/default-layout';
import { MobileLayout } from '/@/renderer/layouts/mobile-layout/mobile-layout';
import { AppRoute } from '/@/renderer/router/routes';
import {
    useCommandPalette,
    useHotkeySettings,
    useSettingsStoreActions,
    useZoomFactor,
} from '/@/renderer/store';
import { HotkeyItem, useHotkeys } from '/@/shared/hooks/use-hotkeys';

interface ResponsiveLayoutProps {
    shell?: boolean;
}

const ResponsiveLayoutBase = ({ shell }: ResponsiveLayoutProps) => {
    const isMobile = useIsMobile();

    if (isMobile) {
        return <MobileLayout shell={shell} />;
    }

    return <DefaultLayout shell={shell} />;
};

export const ResponsiveLayout = ({ shell }: ResponsiveLayoutProps) => {
    useAppTracker();

    return (
        <>
            <ResponsiveLayoutBase shell={shell} />
            <LayoutHotkeys />
            <GarbageCollection />
        </>
    );
};

const LayoutHotkeys = () => {
    const navigate = useNavigate();
    const localSettings = isElectron() ? window.api.localSettings : null;
    const zoomFactor = useZoomFactor();
    const { setSettings } = useSettingsStoreActions();
    const { bindings } = useHotkeySettings();
    const { opened, ...handlers } = useCommandPalette();

    const updateZoom = (increase: number) => {
        const newVal = zoomFactor + increase;
        if (newVal > 300 || newVal < 50 || !isElectron()) return;
        setSettings({
            general: {
                zoomFactor: newVal,
            },
        });
        localSettings?.setZoomFactor(zoomFactor);
    };
    localSettings?.setZoomFactor(zoomFactor);

    const zoomHotkeys: HotkeyItem[] = [
        [bindings.zoomIn.hotkey, () => updateZoom(5)],
        [bindings.zoomOut.hotkey, () => updateZoom(-5)],
    ];

    useHotkeys([
        [bindings.globalSearch.hotkey, () => handlers.open()],
        [bindings.browserBack.hotkey, () => navigate(-1)],
        [bindings.browserForward.hotkey, () => navigate(1)],
        [bindings.navigateHome.hotkey, () => navigate(AppRoute.HOME)],
        ...(isElectron() ? zoomHotkeys : []),
    ]);

    return <CommandPalette modalProps={{ handlers, opened }} />;
};

const GarbageCollection = () => {
    useGarbageCollection();
    return null;
};
