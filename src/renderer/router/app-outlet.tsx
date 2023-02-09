import { useState, useEffect } from 'react';
import isElectron from 'is-electron';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';

const localSettings = isElectron() ? window.electron.localSettings : null;

export const AppOutlet = () => {
  const location = useLocation();
  const currentServer = useCurrentServer();

  const [isMpvRequired, setIsMpvRequired] = useState(false);
  const isServerRequired = !currentServer;

  useEffect(() => {
    const getMpvPath = async () => {
      if (!isElectron()) return setIsMpvRequired(false);
      const mpvPath = await localSettings.get('mpv_path');

      if (mpvPath) {
        return setIsMpvRequired(false);
      }

      return setIsMpvRequired(true);
    };

    getMpvPath();
  }, []);

  const actions = [isServerRequired, isMpvRequired];
  const actionRequired = actions.some((c) => c);

  if (actionRequired) {
    return (
      <Navigate
        replace
        state={{ from: location }}
        to={AppRoute.ACTION_REQUIRED}
      />
    );
  }

  return <Outlet />;
};
