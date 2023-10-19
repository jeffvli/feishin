import { lazy } from 'react';
import { Tabs } from '/@/renderer/components';
import { useSettingsStore, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import isElectron from 'is-electron';
import styled from 'styled-components';

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

const AdvancedAudioTab = lazy(() =>
    import('/@/renderer/features/settings/components/advanced-audio/advanced-audio-tab').then(
        (module) => ({
            default: module.AdvancedAudioTab,
        }),
    ),
);

const TabContainer = styled.div`
    width: 100%;
    height: 100%;
    padding: 1rem;
    overflow: scroll;
`;

export const SettingsContent = () => {
    const currentTab = useSettingsStore((state) => state.tab);
    const { setSettings } = useSettingsStoreActions();

    return (
        <TabContainer>
            <Tabs
                keepMounted={false}
                orientation="horizontal"
                value={currentTab}
                variant="default"
                onTabChange={(e) => e && setSettings({ tab: e })}
            >
                <Tabs.List>
                    <Tabs.Tab value="general">General</Tabs.Tab>
                    <Tabs.Tab value="playback">Playback</Tabs.Tab>
                    <Tabs.Tab value="hotkeys">Hotkeys</Tabs.Tab>
                    {isElectron() && <Tabs.Tab value="window">Window</Tabs.Tab>}
                    {(isElectron() || 'AudioContext' in window) && (
                        <Tabs.Tab value="advanced-audio">Advanced Audio settings</Tabs.Tab>
                    )}
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
                <Tabs.Panel value="advanced-audio">
                    <AdvancedAudioTab />
                </Tabs.Panel>
            </Tabs>
        </TabContainer>
    );
};
