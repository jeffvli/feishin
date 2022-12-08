import type { ReactNode } from 'react';
import { Group } from '@mantine/core';
import styled from 'styled-components';
import { AppMenu } from '/@/features/titlebar/components/app-menu';
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
            <>
              {/* <ActivityMenu /> */}
              <AppMenu />
            </>
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
