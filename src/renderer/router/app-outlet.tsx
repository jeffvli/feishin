import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/renderer/store';

interface PrivateOutletProps {
  redirectTo: string;
}

export const AppOutlet = ({ redirectTo }: PrivateOutletProps) => {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);
  const logout = useAuthStore((state) => state.logout);

  if (isAuthenticated) {
    return <Outlet />;
  }

  logout();
  return <Navigate replace state={{ from: location }} to={redirectTo} />;
};
