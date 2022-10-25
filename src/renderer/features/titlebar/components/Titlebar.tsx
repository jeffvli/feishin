import { ReactNode } from 'react';
import styled from '@emotion/styled';
import { Group } from '@mantine/core';
import { FiActivity } from 'react-icons/fi';
import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { AppMenu } from '@/renderer/features/titlebar/components/app-menu';
import { useAuthStore } from '@/renderer/store';
import { Button } from '../../../components';
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
  flex: 1/3;
  height: 100%;
`;

const Center = styled.div`
  flex: 1/3;
  height: 100%;
`;

const Right = styled.div`
  flex: 1/3;
  height: 100%;
`;

export const Titlebar = ({ children }: TitlebarProps) => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);

  return (
    <>
      <TitlebarContainer>
        <Left>
          <Group spacing="xs">
            {isAuthenticated && (
              <>
                <Button
                  px={5}
                  size="xs"
                  sx={{ color: 'var(--titlebar-fg)' }}
                  variant="subtle"
                  onClick={() => navigate(-1)}
                >
                  <RiArrowLeftSLine size={20} />
                </Button>
                <Button
                  px={5}
                  size="xs"
                  sx={{ color: 'var(--titlebar-fg)' }}
                  variant="subtle"
                  onClick={() => navigate(1)}
                >
                  <RiArrowRightSLine size={20} />
                </Button>
              </>
            )}
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
