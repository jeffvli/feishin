import {
  Button,
  Checkbox,
  ModalProps,
  PasswordInput,
  SegmentedControl,
  Stack,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { ServerResponse } from 'renderer/api/types';

interface EditServerModalProps extends ModalProps {
  server: ServerResponse | undefined;
}

export const EditServerModal = ({ server }: EditServerModalProps) => {
  const { t } = useTranslation();

  const form = useForm({
    initialValues: {
      legacyAuth: false,
      name: server?.name,
      password: '',
      serverType: server?.serverType,
      url: server?.url,
      username: server?.username,
    },
  });

  return (
    <form onSubmit={form.onSubmit(async () => {})}>
      <Stack>
        <SegmentedControl
          disabled
          data={[
            { label: 'Jellyfin', value: 'jellyfin' },
            { label: 'Subsonic', value: 'subsonic' },
          ]}
          {...form.getInputProps('serverType')}
        />
        <TextInput label={t('server.name')} {...form.getInputProps('name')} />
        <TextInput label={t('server.url')} {...form.getInputProps('url')} />
        <TextInput
          label={t('server.username')}
          {...form.getInputProps('username')}
        />
        <PasswordInput
          label={t('server.password')}
          {...form.getInputProps('password')}
        />
        {form.getInputProps('serverType').value === 'subsonic' && (
          <Checkbox
            label={t('server.legacyauth')}
            {...form.getInputProps('legacyAuth', { type: 'checkbox' })}
          />
        )}
        <Button type="submit">{t('server.submit')}</Button>
      </Stack>
    </form>
  );
};
