import { useState, useEffect } from 'react';
import isElectron from 'is-electron';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { localSettings } from '#preload';
import { AppRoute } from '/@/router/routes';
import { useCurrentServer } from '../store';

export const AppOutlet = () => {
  const location = useLocation();
  const currentServer = useCurrentServer();

  const [isMpvRequired, setIsMpvRequired] = useState(false);
  const isServerRequired = !currentServer;

  useEffect(() => {
    const getMpvPath = async () => {
      if (!isElectron()) return setIsMpvRequired(false);
      const mpvPath = await localSettings.get('mpv_path');
      return setIsMpvRequired(!mpvPath);
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
