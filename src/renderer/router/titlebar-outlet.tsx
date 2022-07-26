import { Outlet } from 'react-router';
import styled from 'styled-components';
import { Titlebar } from '/@/renderer/features/titlebar/components/titlebar';

const TitlebarContainer = styled.header`
  position: absolute;
  top: 0;
  right: 0;
  z-index: 5000;
  height: 2.5rem;
  background: var(--titlebar-bg);
  -webkit-app-region: drag;
  opacity: 0.85;
`;

export const TitlebarOutlet = () => {
  return (
    <>
      <TitlebarContainer>
        <Titlebar />
      </TitlebarContainer>
      <Outlet />
    </>
  );
};
