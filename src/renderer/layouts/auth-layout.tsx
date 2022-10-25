import styled from '@emotion/styled';
import { Outlet } from 'react-router-dom';
import { Titlebar } from '../features/titlebar';

const WindowsTitlebarContainer = styled.div`
  position: absolute;
  z-index: 1000;
  display: flex;
  width: 100%;
  height: 50px;
  user-select: none;
  -webkit-app-region: drag;
`;

const ContentContainer = styled.div`
  display: flex;
  height: 100%;
`;

export const AuthLayout = () => {
  return (
    <>
      <WindowsTitlebarContainer>
        <Titlebar />
      </WindowsTitlebarContainer>
      <ContentContainer>
        <Outlet />
      </ContentContainer>
    </>
  );
};
