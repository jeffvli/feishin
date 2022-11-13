import { ReactNode } from 'react';
import { Group } from '@mantine/core';
import styled from 'styled-components';
import { ActivityMenu } from '@/renderer/features/titlebar/components/activity-menu';
import { AppMenu } from '@/renderer/features/titlebar/components/app-menu';
import { useAuthStore } from '@/renderer/store';
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
  color: var(--titlebar-fg);

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
          <Group>Feishin</Group>
        </Left>
        <Center />
        <Right>
          {children}
          <Group spacing="xs">
            {isAuthenticated && (
              <>
                <ActivityMenu />
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
