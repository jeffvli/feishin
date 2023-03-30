import { RiSettings2Fill } from 'react-icons/ri';
import { PageHeader } from '/@/renderer/components';
import { LibraryHeaderBar } from '/@/renderer/features/shared';

export const SettingsHeader = () => {
  return (
    <PageHeader>
      <LibraryHeaderBar>
        <RiSettings2Fill size="2rem" />
        <LibraryHeaderBar.Title>Settings</LibraryHeaderBar.Title>
      </LibraryHeaderBar>
    </PageHeader>
  );
};
