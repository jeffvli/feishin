import { useState } from 'react';
import { Checkbox, Stack, Group } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { useFocusTrap } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { remoteServerLogin } from '@/renderer/api/shared.api';
import { Server, ServerType } from '@/renderer/api/types';
import { Button, PasswordInput, TextInput, toast } from '@/renderer/components';
import { useAuthStore } from '@/renderer/store';
import { randomString } from '@/renderer/utils';

interface AddServerCredentialFormProps {
  onCancel: () => void;
  server: Server;
}

const schema = z.object({
  legacyAuth: z.boolean().optional(),
  password: z.string().min(1),
  username: z.string().min(1),
});

export const AddServerCredentialForm = ({
  onCancel,
  server,
}: AddServerCredentialFormProps) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const focusTrapRef = useFocusTrap(true);
  const addServerCredential = useAuthStore(
    (state) => state.addServerCredential
  );

  const form = useForm({
    initialValues: {
      legacy: false,
      password: '',
      url: 'http://',
      username: '',
    },
    validate: zodResolver(schema),
  });

  const handleSubmit = form.onSubmit(async (values) => {
    setIsSubmitting(true);
    const auth = await remoteServerLogin({
      ...values,
      type: server.type,
      url: server.url,
    });

    if (auth.type === 'error') {
      setIsSubmitting(false);
      return toast.show({
        message: auth.message,
        title: 'Failed to add credential',
        type: 'error',
      });
    }

    addServerCredential({
      enabled: false,
      id: randomString(),
      serverId: server.id,
      token: auth.token,
      username: auth.username!,
    });

    setIsSubmitting(false);
    return onCancel();
  });

  return (
    <form onSubmit={handleSubmit}>
      <Stack ref={focusTrapRef}>
        <TextInput
          data-autofocus
          required
          label="Username"
          {...form.getInputProps('username')}
        />
        <PasswordInput
          required
          label="Password"
          {...form.getInputProps('password')}
        />
        {server.type === ServerType.SUBSONIC && (
          <Checkbox
            label={t('modal.add_server.legacy_label')}
            {...form.getInputProps('legacy', { type: 'checkbox' })}
          />
        )}
        <Group position="right">
          <Button disabled={isSubmitting} variant="subtle" onClick={onCancel}>
            Cancel
          </Button>
          <Button loading={isSubmitting} type="submit" variant="filled">
            Add
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
