import { ReactNode } from 'react';
import { Group } from '@mantine/core';
import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { IconButton } from 'renderer/components';
import { WindowControls } from 'renderer/features/window-controls';

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
  -webkit-app-region: drag;
`;

const Left = styled.div`
  height: 100%;

  button {
    -webkit-app-region: no-drag;

    svg {
      transform: scaleX(1);
    }
  }
`;

const Right = styled.div`
  height: 100%;
  -webkit-app-region: no-drag;
`;

export const Titlebar = ({ children }: TitlebarProps) => {
  const navigate = useNavigate();

  return (
    <>
      <TitlebarContainer>
        <Left>
          <Group spacing="xs">
            <IconButton
              icon={<RiArrowLeftSLine size={25} />}
              size={25}
              onClick={() => navigate(-1)}
            />
            <IconButton
              icon={<RiArrowRightSLine size={25} />}
              size={25}
              onClick={() => navigate(1)}
            />
          </Group>
        </Left>
        <Right>
          {children}

          <WindowControls />
        </Right>
      </TitlebarContainer>
    </>
  );
};

Titlebar.defaultProps = {
  children: <></>,
};
