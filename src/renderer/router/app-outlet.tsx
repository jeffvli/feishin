import { useState, useEffect } from 'react';
import isElectron from 'is-electron';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { settings } from '@/renderer/features/settings';
import { useServerCredential } from '@/renderer/features/shared';
import { AppRoute } from '@/renderer/router/routes';
import { useAuthStore } from '@/renderer/store';

interface PrivateOutletProps {
  redirectTo: string;
}

export const AppOutlet = ({ redirectTo }: PrivateOutletProps) => {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);
  const { serverToken } = useServerCredential();
  const currentServer = useAuthStore((state) => state.currentServer);

  const [isMpvRequired, setIsMpvRequired] = useState(false);
  const isServerRequired = !currentServer;
  const isCredentialRequired = currentServer?.noCredential && !serverToken;

  useEffect(() => {
    const getMpvPath = async () => {
      if (!isElectron()) return setIsMpvRequired(false);
      const mpvPath = await settings.get('mpv_path');
      return setIsMpvRequired(!mpvPath);
    };

    getMpvPath();
  }, []);

  const actions = [isServerRequired, isCredentialRequired, isMpvRequired];
  const actionRequired = actions.some((c) => c);

  if (isAuthenticated) {
    return <Outlet />;
  }

  if (isAuthenticated && actionRequired) {
    return (
      <Navigate
        replace
        state={{ from: location }}
        to={AppRoute.ACTION_REQUIRED}
      />
    );
  }

  logout();
  return <Navigate replace state={{ from: location }} to={redirectTo} />;
};
