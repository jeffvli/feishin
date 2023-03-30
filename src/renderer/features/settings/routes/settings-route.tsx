import { Flex } from '@mantine/core';
import { SettingsContent } from '/@/renderer/features/settings/components/settings-content';
import { SettingsHeader } from '/@/renderer/features/settings/components/settings-header';
import { AnimatedPage } from '/@/renderer/features/shared';

const SettingsRoute = () => {
  return (
    <AnimatedPage>
      <Flex
        direction="column"
        h="100%"
        w="100%"
      >
        <SettingsHeader />
        <SettingsContent />
      </Flex>
    </AnimatedPage>
  );
};

export default SettingsRoute;
