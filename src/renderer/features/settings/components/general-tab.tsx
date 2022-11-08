import { Select, Stack } from '@mantine/core';
import { SettingsOptions } from '@/renderer/features/settings/components/settings-option';

export const GeneralTab = () => {
  const options = [
    {
      control: <Select disabled data={[]} />,
      description: 'Primary application language ',
      title: 'Language',
    },
    {
      control: <Select disabled data={[]} />,
      description: 'Theme for the application',
      title: 'Theme',
    },
    {
      control: <Select disabled data={[]} />,
      description: 'Font for the application',
      title: 'Font',
    },
    {
      control: (
        <Select disabled data={['Windows', 'macOS']} defaultValue="Windows" />
      ),
      description: 'Font for the application',
      title: 'Titlebar style',
    },
  ];

  return (
    <Stack mt="1rem" spacing="xl">
      {options.map((option) => (
        <SettingsOptions key={`general-${option.title}`} {...option} />
      ))}
    </Stack>
  );
};
