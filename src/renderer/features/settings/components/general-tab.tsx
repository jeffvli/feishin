import { Select, Stack } from '@mantine/core';
import { SettingsOptions } from '@/renderer/features/settings/components/settings-option';

export const GeneralTab = () => {
  const options = [
    {
      control: <Select disabled data={[]} />,
      description: 'Sets the application language',
      isHidden: false,
      title: 'Language',
    },
    {
      control: <Select disabled data={[]} />,
      description: 'Sets the default theme',
      isHidden: false,
      title: 'Theme',
    },
    {
      control: <Select disabled data={[]} />,
      description: 'Sets the default font',
      isHidden: false,
      title: 'Font',
    },
    {
      control: (
        <Select disabled data={['Windows', 'macOS']} defaultValue="Windows" />
      ),
      description: 'Adjust the style of the titlebar',
      isHidden: false,
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
