import isElectron from 'is-electron';
import { lazy } from 'react';
import { useTranslation } from 'react-i18next';

import { useSettingsStore, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { Tabs } from '/@/shared/components/tabs/tabs';

const GeneralTab = lazy(() =>
    import('/@/renderer/features/settings/components/general/general-tab').then((module) => ({
        default: module.GeneralTab,
    })),
);

const PlaybackTab = lazy(() =>
    import('/@/renderer/features/settings/components/playback/playback-tab').then((module) => ({
        default: module.PlaybackTab,
    })),
);

const ApplicationTab = lazy(() =>
    import('/@/renderer/features/settings/components/window/window-tab').then((module) => ({
        default: module.WindowTab,
    })),
);

const HotkeysTab = lazy(() =>
    import('/@/renderer/features/settings/components/hotkeys/hotkeys-tab').then((module) => ({
        default: module.HotkeysTab,
    })),
);

const AdvancedTab = lazy(() =>
    import('/@/renderer/features/settings/components/advanced/advanced-tab').then((module) => ({
        default: module.AdvancedTab,
    })),
);

export const SettingsContent = () => {
    const { t } = useTranslation();
    const currentTab = useSettingsStore((state) => state.tab);
    const { setSettings } = useSettingsStoreActions();

    return (
        <div style={{ height: '100%', overflow: 'scroll', padding: '1rem', width: '100%' }}>
            <Tabs
                keepMounted={false}
                onChange={(e) => e && setSettings({ tab: e })}
                orientation="horizontal"
                value={currentTab}
                variant="default"
            >
                <Tabs.List>
                    <Tabs.Tab value="general">
                        {t('page.setting.generalTab', { postProcess: 'sentenceCase' })}
                    </Tabs.Tab>
                    <Tabs.Tab value="playback">
                        {t('page.setting.playbackTab', { postProcess: 'sentenceCase' })}
                    </Tabs.Tab>
                    <Tabs.Tab value="hotkeys">
                        {t('page.setting.hotkeysTab', { postProcess: 'sentenceCase' })}
                    </Tabs.Tab>
                    {isElectron() && (
                        <Tabs.Tab value="window">
                            {t('page.setting.windowTab', { postProcess: 'sentenceCase' })}
                        </Tabs.Tab>
                    )}
                    <Tabs.Tab value="advanced">
                        {t('page.setting.advanced', { postProcess: 'sentenceCase' })}
                    </Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel value="general">
                    <GeneralTab />
                </Tabs.Panel>
                <Tabs.Panel value="playback">
                    <PlaybackTab />
                </Tabs.Panel>
                <Tabs.Panel value="hotkeys">
                    <HotkeysTab />
                </Tabs.Panel>
                {isElectron() && (
                    <Tabs.Panel value="window">
                        <ApplicationTab />
                    </Tabs.Panel>
                )}
                <Tabs.Panel value="advanced">
                    <AdvancedTab />
                </Tabs.Panel>
            </Tabs>
        </div>
    );
};
