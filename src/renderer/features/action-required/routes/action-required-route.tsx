import { useState, useEffect } from 'react';
import { Center, Group, Stack } from '@mantine/core';
import isElectron from 'is-electron';
import { RiCheckFill } from 'react-icons/ri';
import { Link } from 'react-router-dom';
import { Button, Text } from '@/renderer/components';
import { ActionRequiredContainer } from '@/renderer/features/action-required/components/action-required-container';
import { MpvRequired } from '@/renderer/features/action-required/components/mpv-required';
import { ServerCredentialRequired } from '@/renderer/features/action-required/components/server-credential-required';
import { ServerRequired } from '@/renderer/features/action-required/components/server-required';
import { settings } from '@/renderer/features/settings';
import { useServerCredential } from '@/renderer/features/shared';
import { AppRoute } from '@/renderer/router/routes';
import { useAuthStore } from '@/renderer/store';

export const ActionRequiredRoute = () => {
  const { serverToken } = useServerCredential();
  const currentServer = useAuthStore((state) => state.currentServer);
  const [isMpvRequired, setIsMpvRequired] = useState(false);
  const isServerRequired = !currentServer;
  const isCredentialRequired = currentServer?.noCredential && !serverToken;

  useEffect(() => {
    const getMpvPath = async () => {
      if (!isElectron()) return setIsMpvRequired(false);
      const mpvPath = await settings.get('mpv_path');
      return setIsMpvRequired(!mpvPath);
    };

    getMpvPath();
  }, []);

  const checks = [
    {
      component: <MpvRequired />,
      title: 'MPV required',
      valid: !isMpvRequired,
    },
    {
      component: <ServerCredentialRequired />,
      title: 'Credentials required',
      valid: !isCredentialRequired,
    },
    {
      component: <ServerRequired />,
      title: 'Server required',
      valid: !isServerRequired,
    },
  ];

  const canReturnHome = checks.every((c) => c.valid);
  const displayedCheck = checks.find((c) => !c.valid);

  return (
    <>
      <Center sx={{ width: '100vw' }}>
        <Stack spacing="xl" sx={{ maxWidth: '50%' }}>
          <Group noWrap>
            {displayedCheck && (
              <ActionRequiredContainer title={displayedCheck.title}>
                {displayedCheck?.component}
              </ActionRequiredContainer>
            )}
          </Group>
          <Stack mt="2rem">
            {canReturnHome && (
              <>
                <Group noWrap position="center">
                  <RiCheckFill color="var(--success-color)" size={30} />
                  <Text size="xl">No issues found</Text>
                </Group>
                <Button
                  component={Link}
                  disabled={!canReturnHome}
                  to={AppRoute.HOME}
                  variant="filled"
                >
                  Go back
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </Center>
    </>
  );
};
