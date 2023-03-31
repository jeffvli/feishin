import { Flex, Group } from '@mantine/core';
import { closeAllModals, openModal } from '@mantine/modals';
import { RiSettings2Fill } from 'react-icons/ri';
import { Button, ConfirmModal, PageHeader } from '/@/renderer/components';
import { LibraryHeaderBar } from '/@/renderer/features/shared';
import packageJson from '../../../../../package.json';
import { useSettingsStoreActions } from '../../../store/settings.store';

export const SettingsHeader = () => {
  const { reset } = useSettingsStoreActions();

  const handleResetToDefault = () => {
    reset();
    closeAllModals();
  };

  const openResetConfirmModal = () => {
    openModal({
      children: <ConfirmModal onConfirm={handleResetToDefault}>Are you sure?</ConfirmModal>,
      title: 'Reset settings to default',
    });
  };

  return (
    <PageHeader>
      <LibraryHeaderBar>
        <Flex
          align="center"
          justify="space-between"
          w="100%"
        >
          <Group noWrap>
            <RiSettings2Fill size="2rem" />
            <LibraryHeaderBar.Title>Settings</LibraryHeaderBar.Title>
            <LibraryHeaderBar.Badge>v{packageJson.version}</LibraryHeaderBar.Badge>
          </Group>
          <Button
            compact
            variant="default"
            onClick={openResetConfirmModal}
          >
            Reset to default
          </Button>
        </Flex>
      </LibraryHeaderBar>
    </PageHeader>
  );
};
