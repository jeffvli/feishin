import { useMemo } from 'react';
import { useAuthStore } from '@/renderer/store';

export const usePermissions = () => {
  const permissions = useAuthStore((state) => state.permissions);

  const permissionSet = useMemo(() => {
    const set = {
      createServer: permissions.isAdmin,
      createServerCredential: true,
      createServerUrl: permissions.isAdmin,
      deleteServer: permissions.isAdmin,
      deleteServerCredential: true,
      deleteServerUrl: permissions.isAdmin,
      editServer: permissions.isAdmin,
    };

    return set;
  }, [permissions]);

  return permissionSet;
};
