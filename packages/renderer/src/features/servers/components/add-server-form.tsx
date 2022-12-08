import { useState } from 'react';
import { Checkbox, Stack, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useFocusTrap } from '@mantine/hooks';
import { jellyfinApi } from '/@/api/jellyfin.api';
import { navidromeApi } from '/@/api/navidrome.api';
import { subsonicApi } from '/@/api/subsonic.api';
import type { AuthResponse } from '/@/api/types';
import { ServerType } from '/@/types';
import { Button, PasswordInput, TextInput, SegmentedControl, toast } from '/@/components';
import { useAuthStoreActions } from '/@/store';
import { closeAllModals } from '@mantine/modals';
import { nanoid } from 'nanoid/non-secure';

const SERVER_TYPES = [
  { label: 'Jellyfin', value: ServerType.JELLYFIN },
  { label: 'Navidrome', value: ServerType.NAVIDROME },
  { label: 'Subsonic', value: ServerType.SUBSONIC },
];

const AUTH_FUNCTIONS = {
  [ServerType.JELLYFIN]: jellyfinApi.authenticate,
  [ServerType.NAVIDROME]: navidromeApi.authenticate,
  [ServerType.SUBSONIC]: subsonicApi.authenticate,
};

interface AddServerFormProps {
  onCancel: () => void;
}

export const AddServerForm = ({ onCancel }: AddServerFormProps) => {
  const focusTrapRef = useFocusTrap(true);
  const [isLoading, setIsLoading] = useState(false);
  const { addServer } = useAuthStoreActions();

  const form = useForm({
    initialValues: {
      legacyAuth: false,
      name: '',
      password: '',
      type: ServerType.JELLYFIN,
      url: 'http://',
      username: '',
    },
  });

  const isSubmitDisabled =
    !form.values.name || !form.values.url || !form.values.username || !form.values.password;

  const handleSubmit = form.onSubmit(async (values) => {
    const authFunction = AUTH_FUNCTIONS[values.type];

    if (!authFunction) {
      return toast.error({ message: 'Selected server type is invalid' });
    }

    try {
      setIsLoading(true);
      const data: AuthResponse = await authFunction({
        legacy: values.legacyAuth,
        password: values.password,
        url: values.url,
        username: values.username,
      });

      addServer({
        credential: data.credential,
        id: nanoid(),
        name: values.name,
        ndCredential: data.ndCredential,
        type: values.type,
        url: values.url,
        username: data.username,
      });

      toast.success({ message: 'Server added' });
      closeAllModals();
    } catch (err: any) {
      setIsLoading(false);
      return toast.error({ message: err?.message });
    }

    setIsLoading(false);
  });

  return (
    <form onSubmit={handleSubmit}>
      <Stack
        ref={focusTrapRef}
        m={5}
      >
        <SegmentedControl
          data={SERVER_TYPES}
          {...form.getInputProps('type')}
        />
        <Group grow>
          <TextInput
            data-autofocus
            label="Name"
            {...form.getInputProps('name')}
          />
          <TextInput
            label="Url"
            {...form.getInputProps('url')}
          />
        </Group>
        <TextInput
          label="Username"
          {...form.getInputProps('username')}
        />
        <PasswordInput
          label="Password"
          {...form.getInputProps('password')}
        />
        {form.values.type === ServerType.SUBSONIC && (
          <Checkbox
            label="Enable legacy authentication"
            {...form.getInputProps('legacyAuth', { type: 'checkbox' })}
          />
        )}
        <Group position="right">
          <Button
            variant="subtle"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            disabled={isSubmitDisabled}
            loading={isLoading}
            type="submit"
            variant="filled"
          >
            Add
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
