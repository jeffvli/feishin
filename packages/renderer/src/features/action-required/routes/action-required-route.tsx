import { useState, useEffect } from 'react';
import { Center, Group, Stack } from '@mantine/core';
import isElectron from 'is-electron';
import { RiCheckFill } from 'react-icons/ri';
import { Link } from 'react-router-dom';
import { Button, Text } from '/@/components';
import { ActionRequiredContainer } from '/@/features/action-required/components/action-required-container';
import { MpvRequired } from '/@/features/action-required/components/mpv-required';
import { ServerCredentialRequired } from '/@/features/action-required/components/server-credential-required';
import { ServerRequired } from '/@/features/action-required/components/server-required';
import { AnimatedPage } from '/@/features/shared';
import { AppRoute } from '/@/router/routes';
import { useCurrentServer } from '/@/store';
import { localSettings } from '#preload';

export const ActionRequiredRoute = () => {
  const currentServer = useCurrentServer();
  const [isMpvRequired, setIsMpvRequired] = useState(false);
  const isServerRequired = !currentServer;
  // const isCredentialRequired = currentServer?.noCredential && !serverToken;
  const isCredentialRequired = false;

  useEffect(() => {
    const getMpvPath = async () => {
      if (!isElectron()) return setIsMpvRequired(false);
      const mpvPath = await localSettings.get('mpv_path');
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
    <AnimatedPage>
      <Center sx={{ height: '100%', width: '100vw' }}>
        <Stack
          spacing="xl"
          sx={{ maxWidth: '50%' }}
        >
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
                <Group
                  noWrap
                  position="center"
                >
                  <RiCheckFill
                    color="var(--success-color)"
                    size={30}
                  />
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
    </AnimatedPage>
  );
};
