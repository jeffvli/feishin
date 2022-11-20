import { useMutation } from '@tanstack/react-query';
import md5 from 'md5';
import { nanoid } from 'nanoid';
import { api } from '@/renderer/api';
import { QueryOptions } from '@/renderer/lib/react-query';
import { useAuthStore } from '@/renderer/store';

export const useLogin = (
  serverUrl: string,
  body: {
    password: string;
    username: string;
  },
  options?: QueryOptions
) => {
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: () => api.auth.login(serverUrl, body),
    onSuccess: (res) => {
      const props = {
        accessToken: res.data.accessToken,
        permissions: {
          id: res.data.id,
          isAdmin: res.data.isAdmin,
          isSuperAdmin: res.data.isSuperAdmin,
          username: res.data.username,
        },
        refreshToken: res.data.refreshToken,
        serverKey: md5(serverUrl),
        serverUrl,
      };

      login(props);

      if (!localStorage.getItem('device_id')) {
        localStorage.setItem('device_id', nanoid());
      }
    },
    ...options,
  });
};
