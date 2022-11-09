import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/renderer/api/query-keys';
import { ServerListResponse } from '@/renderer/api/servers.api';
import { ServerPermissionType } from '@/renderer/api/types';
import { UserDetailResponse } from '@/renderer/api/users.api';
import { useAuthStore } from '@/renderer/store';

export enum ServerPermission {
  VIEWER = 0,
  EDITOR = 1,
  ADMIN = 2,
}

const SERVER_PERMISSION_MAP = {
  [ServerPermissionType.VIEWER]: 0,
  [ServerPermissionType.EDITOR]: 1,
  [ServerPermissionType.ADMIN]: 2,
};

export const usePermissions = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.permissions.id);
  const permissions = useAuthStore((state) => state.permissions);

  const user = queryClient.getQueryData<UserDetailResponse>(
    queryKeys.users.detail(userId)
  );

  const servers = queryClient.getQueryData<ServerListResponse>(
    queryKeys.servers.list()
  );

  const permissionSet: { [key: string]: any } = useMemo(() => {
    const serverPermissions: { [key: string]: ServerPermission } = {};

    servers?.data?.forEach((server) => {
      const permission = user?.data?.serverPermissions?.find(
        (p) => p.serverId === server.id
      )?.type;

      serverPermissions[server.id] =
        permissions.isAdmin || permissions.isSuperAdmin
          ? ServerPermission.ADMIN
          : permission
          ? SERVER_PERMISSION_MAP[permission]
          : -1;
    });

    return {
      isAdmin: permissions.isAdmin || permissions.isSuperAdmin,
      isSuperAdmin: permissions.isSuperAdmin,
      ...serverPermissions,
    };
  }, [
    permissions.isAdmin,
    permissions.isSuperAdmin,
    servers?.data,
    user?.data?.serverPermissions,
  ]);

  return permissionSet;
};
