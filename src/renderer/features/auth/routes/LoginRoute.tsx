import React, { useState } from 'react';
import {
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Title,
  Loader,
  Alert,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, CircleCheck } from 'tabler-icons-react';
import { normalizeServerUrl } from 'renderer/utils';
import { useLogin } from '../queries/useLogin';
import { usePingServer } from '../queries/usePingServer';
import styles from './LoginRoute.module.scss';

export const LoginRoute = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const [username, setUsername] = useState(searchParams.get('username') || '');
  const [password, setPassword] = useState(searchParams.get('password') || '');
  const [server, setServer] = useState(
    searchParams.get('server') || 'http://localhost:9321'
  );
  const [debouncedServer] = useDebouncedValue(server, 500);

  const {
    mutate: handleLogin,
    isLoading,
    isError,
  } = useLogin(normalizeServerUrl(server), {
    password,
    username,
  });

  const {
    isLoading: isCheckingServer,
    isSuccess: isValidServer,
    isFetched,
  } = usePingServer(normalizeServerUrl(debouncedServer));

  return (
    <div className={styles.container}>
      <Title>{t('auth.login')}</Title>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin(undefined, {
            onError: () => {},
            onSuccess: () => {},
          });
        }}
      >
        <Stack spacing="md">
          <TextInput
            required
            disabled={isLoading}
            error={!isValidServer && isFetched}
            label={`${t('auth.server.label')}`}
            placeholder={`${t('auth.server.placeholder')}`}
            rightSection={
              isCheckingServer ? (
                <Loader size="xs" />
              ) : isValidServer ? (
                <CircleCheck />
              ) : null
            }
            value={server}
            variant="default"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setServer(e.currentTarget.value)
            }
          />
          <TextInput
            required
            disabled={isLoading}
            label={`${t('auth.username.label')}`}
            placeholder={`${t('auth.username.placeholder')}`}
            value={username}
            variant="default"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setUsername(e.currentTarget.value)
            }
          />
          <PasswordInput
            required
            disabled={isLoading}
            label={`${t('auth.password.label')}`}
            placeholder={`${t('auth.password.placeholder')}`}
            value={password}
            variant="default"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(e.currentTarget.value)
            }
          />
          <Button
            className={styles.button}
            disabled={!isValidServer}
            type="submit"
          >
            Login
          </Button>
          {isError && (
            <Alert color="red" icon={<AlertCircle />} variant="outline">
              {t('Invalid username or password.')}
            </Alert>
          )}
        </Stack>
      </form>
    </div>
  );
};
