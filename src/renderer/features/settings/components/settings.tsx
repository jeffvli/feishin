import { Box } from '@mantine/core';
import { Tabs } from '@/renderer/components';
import { GeneralTab } from '@/renderer/features/settings/components/general-tab';
import { PlaybackTab } from '@/renderer/features/settings/components/playback-tab';
import { useSettingsStore } from '@/renderer/store/settings.store';

export const Settings = () => {
  const currentTab = useSettingsStore((state) => state.tab);
  const update = useSettingsStore((state) => state.setSettings);
  return (
    <Box pr={15} sx={{ height: '800px', maxHeight: '50vh' }}>
      <Tabs
        orientation="horizontal"
        styles={{
          tab: {
            fontSize: '1.1rem',
            padding: '0.5rem 1rem',
          },
        }}
        value={currentTab}
        variant="default"
        onChange={(e) => console.log(e)}
        onTabChange={(e) => e && update({ tab: e })}
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
