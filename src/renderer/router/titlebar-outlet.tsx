import { Outlet } from 'react-router';
import styled from 'styled-components';
import { Titlebar } from '/@/renderer/features/titlebar/components/titlebar';
import { useWindowSettings } from '/@/renderer/store/settings.store';
import { Platform } from '/@/renderer/types';

const TitlebarContainer = styled.header`
  position: absolute;
  top: 0;
  right: 0;
  z-index: 5000;
  height: 65px;
  background: var(--titlebar-controls-bg);
  -webkit-app-region: drag;
`;

export const TitlebarOutlet = () => {
  const { windowBarStyle } = useWindowSettings();

  return (
    <>
      {windowBarStyle === Platform.WEB && (
        <TitlebarContainer>
          <Titlebar />
        </TitlebarContainer>
      )}
      <Outlet />
    </>
  );
};
