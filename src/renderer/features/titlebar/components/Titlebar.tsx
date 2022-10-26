import { ReactNode } from 'react';
import styled from '@emotion/styled';
import { Group } from '@mantine/core';
import { FiActivity } from 'react-icons/fi';
import { Button, Text } from '@/renderer/components';
import { AppMenu } from '@/renderer/features/titlebar/components/app-menu';
import { useAuthStore } from '@/renderer/store';
import { Font } from '@/renderer/styles';
import { WindowControls } from '../../window-controls';

interface TitlebarProps {
  children?: ReactNode;
}

const TitlebarContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;

  button {
    -webkit-app-region: no-drag;

    svg {
      transform: scaleX(1);
    }
  }
`;

const Left = styled.div`
  display: flex;
  flex: 1/3;
  justify-content: center;
  height: 100%;
  padding-left: 1rem;
`;

const Center = styled.div`
  display: flex;
  flex: 1/3;
  justify-content: center;
  height: 100%;
`;

const Right = styled.div`
  display: flex;
  flex: 1/3;
  justify-content: center;
  height: 100%;
`;

export const Titlebar = ({ children }: TitlebarProps) => {
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);

  return (
    <>
      <TitlebarContainer>
        <Left>
          <Group>
            <Text font={Font.POPPINS}>Feishin</Text>
          </Group>
        </Left>
        <Center />
        <Right>
          {children}
          <Group spacing="xs">
            {isAuthenticated && (
              <>
                <Button
                  px={5}
                  size="xs"
                  sx={{ color: 'var(--titlebar-fg)' }}
                  variant="subtle"
                >
                  <FiActivity size={15} />
                </Button>
                <AppMenu />
              </>
            )}
            <WindowControls />
          </Group>
        </Right>
      </TitlebarContainer>
    </>
  );
};

Titlebar.defaultProps = {
  children: undefined,
};
