import { Box } from '@mantine/core';
import { Tabs } from '/@/renderer/components';
import type { Variants } from 'framer-motion';
import { AnimatePresence, motion } from 'framer-motion';
import { GeneralTab } from '/@/renderer/features/settings/components/general-tab';
import { PlaybackTab } from '/@/renderer/features/settings/components/playback-tab';
import { useSettingsStore, useSettingsStoreActions } from '/@/renderer/store/settings.store';

export const Settings = () => {
  const currentTab = useSettingsStore((state) => state.tab);
  const { setSettings } = useSettingsStoreActions();

  const tabVariants: Variants = {
    in: {
      opacity: 1,
      transition: {
        duration: 0.3,
      },
      x: 0,
    },
    out: {
      opacity: 0,
      x: 50,
    },
  };

  return (
    <Box
      m={5}
      sx={{ height: '50vh', maxHeight: '500px', overflowX: 'hidden' }}
    >
      <AnimatePresence initial={false}>
        <Tabs
          keepMounted={false}
          orientation="vertical"
          styles={{
            tab: {
              fontSize: '1.1rem',
              padding: '0.5rem 1rem',
            },
          }}
          value={currentTab}
          variant="pills"
          onTabChange={(e) => e && setSettings({ tab: e })}
        >
          <Tabs.List>
            <Tabs.Tab value="general">General</Tabs.Tab>
            <Tabs.Tab value="playback">Playback</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="general">
            <motion.div
              animate="in"
              initial="out"
              variants={tabVariants}
            >
              <GeneralTab />
            </motion.div>
          </Tabs.Panel>
          <Tabs.Panel value="playback">
            <motion.div
              animate="in"
              initial="out"
              variants={tabVariants}
            >
              <PlaybackTab />
            </motion.div>
          </Tabs.Panel>
        </Tabs>
      </AnimatePresence>
    </Box>
  );
};
