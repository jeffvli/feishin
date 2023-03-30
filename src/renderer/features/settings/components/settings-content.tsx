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
  import('/@/renderer/features/settings/components/playback-tab').then((module) => ({
    default: module.PlaybackTab,
  })),
);

const ApplicationTab = lazy(() =>
  import('/@/renderer/features/settings/components/window/window-tab').then((module) => ({
    default: module.WindowTab,
  })),
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
          {isElectron() && <Tabs.Tab value="window">Window</Tabs.Tab>}
        </Tabs.List>
        <Tabs.Panel value="general">
          <GeneralTab />
        </Tabs.Panel>
        <Tabs.Panel value="playback">
          <PlaybackTab />
        </Tabs.Panel>
        {isElectron() && (
          <Tabs.Panel value="window">
            <ApplicationTab />
          </Tabs.Panel>
        )}
      </Tabs>
    </TabContainer>
  );
};
