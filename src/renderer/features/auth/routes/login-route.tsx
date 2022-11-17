import React, { useState } from 'react';
import { Stack, Alert, Box, Center, Group } from '@mantine/core';
import { ErrorBoundary } from 'react-error-boundary';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { Button, PasswordInput, Text, TextInput } from '@/renderer/components';
import { ErrorFallback } from '@/renderer/features/action-required';
import { useLogin } from '@/renderer/features/auth/queries/use-login';
import { normalizeServerUrl } from '@/renderer/utils';

const Container = styled(Box)`
  width: 100%;
  background: var(--main-bg);
`;

export const LoginRoute = () => {
  const [searchParams] = useSearchParams();

  const [errorMessage, setErrorMessage] = useState('');
  const [username, setUsername] = useState(searchParams.get('username') || '');
  const [password, setPassword] = useState(searchParams.get('password') || '');
  const [server, setServer] = useState(
    searchParams.get('server') || 'http://localhost:8843'
  );

  const {
    mutate: handleLogin,
    isLoading,
    isError,
  } = useLogin(
    normalizeServerUrl(server),
    {
      password,
      username,
    },
    {
      onError: (error) => {
        setErrorMessage(error?.response?.data?.error || error.message);
      },
    }
  );

  return (
    <Container>
      <Center sx={{ height: '100%' }}>
        <Stack
          spacing={0}
          sx={{
            filter: 'drop-shadow(0 0 5px var(--generic-border-color))',
            height: '50%',
            maxWidth: '800px',
            minWidth: '500px',
            width: '40vw',
          }}
        >
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Group position="center">
              <form
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%',
                }}
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin(undefined, {
                    onError: () => {},
                    onSuccess: () => {},
                  });
                }}
              >
                <Stack
                  p="2rem"
                  spacing="xl"
                  sx={{
                    background: 'var(--main-bg)',
                    borderRadius: '5px',
                    width: '80%',
                  }}
                >
                  <Text
                    gradient={{ deg: 45, from: 'indigo', to: 'cyan' }}
                    size="xl"
                    variant="gradient"
                  >
                    Login to Feishin
                  </Text>
                  <TextInput
                    disabled={isLoading}
                    label="Server URL"
                    placeholder="http://localhost:8843"
                    value={server}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setServer(e.currentTarget.value)
                    }
                  />
                  <TextInput
                    disabled={isLoading}
                    label="Username"
                    value={username}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setUsername(e.currentTarget.value)
                    }
                  />
                  <PasswordInput
                    disabled={isLoading}
                    label="Password"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPassword(e.currentTarget.value)
                    }
                  />
                  <Button
                    disabled={!username || !password}
                    loading={isLoading}
                    radius="xl"
                    type="submit"
                  >
                    Login
                  </Button>
                  {isError && <Alert color="red">{errorMessage}</Alert>}
                </Stack>
              </form>
            </Group>
          </ErrorBoundary>
        </Stack>
      </Center>
    </Container>
  );
};
