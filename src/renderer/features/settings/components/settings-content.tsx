import isElectron from 'is-electron';
import { useTranslation } from 'react-i18next';

import styles from './settings-content.module.css';

import { AdvancedTab } from '/@/renderer/features/settings/components/advanced/advanced-tab';
import { GeneralTab } from '/@/renderer/features/settings/components/general/general-tab';
import { HotkeysTab } from '/@/renderer/features/settings/components/hotkeys/hotkeys-tab';
import { PlaybackTab } from '/@/renderer/features/settings/components/playback/playback-tab';
import { WindowTab } from '/@/renderer/features/settings/components/window/window-tab';
import { LibraryContainer } from '/@/renderer/features/shared/components/library-container';
import { useSettingsStore, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { Tabs } from '/@/shared/components/tabs/tabs';

export const SettingsContent = () => {
    const { t } = useTranslation();
    const currentTab = useSettingsStore((state) => state.tab);
    const { setSettings } = useSettingsStoreActions();

    return (
        <LibraryContainer>
            <div className={styles.scrollContainer}>
                <Tabs
                    keepMounted={false}
                    onChange={(e) => e && setSettings({ tab: e })}
                    orientation="horizontal"
                    value={currentTab}
                    variant="default"
                >
                    <Tabs.List>
                        <Tabs.Tab value="general">{t('page.setting.generalTab')}</Tabs.Tab>
                        <Tabs.Tab value="playback">{t('page.setting.playbackTab')}</Tabs.Tab>
                        <Tabs.Tab value="hotkeys">{t('page.setting.hotkeysTab')}</Tabs.Tab>
                        {isElectron() && (
                            <Tabs.Tab value="window">{t('page.setting.windowTab')}</Tabs.Tab>
                        )}
                        <Tabs.Tab value="advanced">{t('page.setting.advanced')}</Tabs.Tab>
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
                            <WindowTab />
                        </Tabs.Panel>
                    )}
                    <Tabs.Panel value="advanced">
                        <AdvancedTab />
                    </Tabs.Panel>
                </Tabs>
            </div>
        </LibraryContainer>
    );
};
