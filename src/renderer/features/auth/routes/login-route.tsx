import React, { useState } from 'react';
import {
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Title,
  Loader,
  Alert,
  Box,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { RiCheckboxCircleFill } from 'react-icons/ri';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { useLogin } from '@/renderer/features/auth/queries/use-login';
import { usePingServer } from '@/renderer/features/auth/queries/use-ping-server';
import { normalizeServerUrl } from '@/renderer/utils';

const Container = styled(Box)`
  min-width: 400px;
  max-width: 50%;
  margin: auto;
  padding: 3rem;
  background: rgba(50, 50, 50, 40%);
  border-radius: 5px;
`;

export const LoginRoute = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const [username, setUsername] = useState(searchParams.get('username') || '');
  const [password, setPassword] = useState(searchParams.get('password') || '');
  const [server, setServer] = useState(
    searchParams.get('server') || 'http://localhost:8843'
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
    <Container>
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
            label={t('auth.server.label')}
            placeholder={t('auth.server.placeholder')}
            rightSection={
              isCheckingServer ? (
                <Loader size="xs" />
              ) : isValidServer ? (
                <RiCheckboxCircleFill size={20} />
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
          <Button disabled={!isValidServer} type="submit">
            Login
          </Button>
          {isError && (
            <Alert color="red" variant="outline">
              {t('Invalid username or password.')}
            </Alert>
          )}
        </Stack>
      </form>
    </Container>
  );
};
