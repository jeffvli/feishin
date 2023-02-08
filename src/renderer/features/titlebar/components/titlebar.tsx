import type { ReactNode } from 'react';
import { Group } from '@mantine/core';
import styled from 'styled-components';
import { WindowControls } from '../../window-controls';

interface TitlebarProps {
  children?: ReactNode;
}

const TitlebarContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  color: var(--titlebar-fg);

  button {
    -webkit-app-region: no-drag;
  }
`;

// const Left = styled.div`
//   display: flex;
//   flex: 1/3;
//   justify-content: center;
//   height: 100%;
//   padding-left: 1rem;
//   opacity: 0;
// `;

// const Center = styled.div`
//   display: flex;
//   flex: 1/3;
//   justify-content: center;
//   height: 100%;
//   opacity: 0;
// `;

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
        <Right>
          {children}
          <Group spacing="xs">
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
