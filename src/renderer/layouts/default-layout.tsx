import { lazy } from 'react';
import isElectron from 'is-electron';
import styled from 'styled-components';
import { useGeneralSettings, useSettingsStore } from '/@/renderer/store/settings.store';
import { Platform, PlaybackType } from '/@/renderer/types';
import { MainContent } from '/@/renderer/layouts/default-layout/main-content';
import { PlayerBar } from '/@/renderer/layouts/default-layout/player-bar';

if (!isElectron()) {
  useSettingsStore.getState().actions.setSettings({
    player: {
      ...useSettingsStore.getState().player,
      type: PlaybackType.WEB,
    },
  });
}

const Layout = styled.div<{ windowBarStyle: Platform }>`
  display: grid;
  grid-template-areas:
    'window-bar'
    'main-content'
    'player';
  grid-template-rows: ${(props) =>
    props.windowBarStyle !== Platform.WEB
      ? '30px calc(100vh - 120px) 90px'
      : '0px calc(100vh - 90px) 90px'};
  grid-template-columns: 1fr;
  gap: 0;
  height: 100%;
`;

const WindowBar = lazy(() =>
  import('/@/renderer/layouts/window-bar').then((module) => ({
    default: module.WindowBar,
  })),
);

interface DefaultLayoutProps {
  shell?: boolean;
}

export const DefaultLayout = ({ shell }: DefaultLayoutProps) => {
  const { windowBarStyle } = useGeneralSettings();

  return (
    <>
      <Layout
        id="default-layout"
        windowBarStyle={windowBarStyle}
      >
        {windowBarStyle !== Platform.WEB && <WindowBar />}
        <MainContent shell={shell} />
        <PlayerBar />
      </Layout>
    </>
  );
};

DefaultLayout.defaultProps = {
  shell: false,
};
