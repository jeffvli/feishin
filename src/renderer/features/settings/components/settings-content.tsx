import { lazy } from 'react';
import { Box } from '@mantine/core';
import { Tabs } from '/@/renderer/components';
import { useSettingsStore, useSettingsStoreActions } from '/@/renderer/store/settings.store';

const GeneralTab = lazy(() =>
  import('/@/renderer/features/settings/components/general-tab').then((module) => ({
    default: module.GeneralTab,
  })),
);

const PlaybackTab = lazy(() =>
  import('/@/renderer/features/settings/components/playback-tab').then((module) => ({
    default: module.PlaybackTab,
  })),
);

export const SettingsContent = () => {
  const currentTab = useSettingsStore((state) => state.tab);
  const { setSettings } = useSettingsStoreActions();

  return (
    <Box
      h="100%"
      p="1rem"
      sx={{ overflow: 'scroll' }}
    >
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
        </Tabs.List>
        <Tabs.Panel value="general">
          <GeneralTab />
        </Tabs.Panel>
        <Tabs.Panel value="playback">
          <PlaybackTab />
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
};
