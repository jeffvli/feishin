import { useState } from 'react';
import { Stack, Group, Checkbox } from '@mantine/core';
import { Button, PasswordInput, SegmentedControl, TextInput, toast } from '/@/renderer/components';
import { useForm } from '@mantine/form';
import { useFocusTrap } from '@mantine/hooks';
import { closeAllModals } from '@mantine/modals';
import isElectron from 'is-electron';
import { nanoid } from 'nanoid/non-secure';
import { AuthenticationResponse } from '/@/renderer/api/types';
import { useAuthStore, useAuthStoreActions, useGeneralSettings } from '/@/renderer/store';
import { ServerType } from '/@/renderer/types';
import { api } from '/@/renderer/api';

const localSettings = isElectron() ? window.electron.localSettings : null;

const SERVER_TYPES = [
  { label: 'Jellyfin', value: ServerType.JELLYFIN },
  { label: 'Navidrome', value: ServerType.NAVIDROME },
  // { label: 'Subsonic', value: ServerType.SUBSONIC },
];

interface AddServerFormProps {
  onCancel: () => void;
}

export const AddServerForm = ({ onCancel }: AddServerFormProps) => {
  const settings = useGeneralSettings();
  const focusTrapRef = useFocusTrap(true);
  const [isLoading, setIsLoading] = useState(false);
  const { addServer, setCurrentServer } = useAuthStoreActions();
  const serverList = useAuthStore((state) => state.serverList);

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

  const isSubmitDisabled = !form.values.name || !form.values.url || !form.values.username;

  const handleSubmit = form.onSubmit(async (values) => {
    const authFunction = api.controller.authenticate;

    if (!authFunction) {
      return toast.error({ message: 'Selected server type is invalid' });
    }

    try {
      setIsLoading(true);
      const data: AuthenticationResponse | undefined = await authFunction(
        values.url,
        {
          legacy: values.legacyAuth,
          password: values.password,
          username: values.username,
        },
        values.type,
      );

      if (!data) {
        return toast.error({ message: 'Authentication failed' });
      }

      const serverItem = {
        credential: data.credential,
        id: nanoid(),
        name: values.name,
        ndCredential: data.ndCredential,
        type: values.type,
        url: values.url.replace(/\/$/, ''),
        userId: data.userId,
        username: data.username,
      };

      addServer(serverItem);
      setCurrentServer(serverItem);
      closeAllModals();

      if (Object.keys(serverList).length === 0) {
        toast.success({ message: 'Server has been added, reloading...' });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast.success({ message: 'Server has been added' });
      }

      if (localSettings && settings.savePassword) {
        const saved = await localSettings.passwordSet(values.password, serverItem.id);
        if (!saved) {
          toast.error({ message: 'Could not save password' });
        }
      }
    } catch (err: any) {
      setIsLoading(false);
      return toast.error({ message: err?.message });
    }

    return setIsLoading(false);
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
