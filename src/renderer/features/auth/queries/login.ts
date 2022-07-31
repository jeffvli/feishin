import md5 from 'md5';
import { nanoid } from 'nanoid';
import { useMutation, useQuery } from 'react-query';
import { authApi } from '../../../api/authApi';
import { queryKeys } from '../../../api/queryKeys';
import { useAuthStore } from '../../../store';

export const useLogin = (
  serverUrl: string,
  body: {
    password: string;
    username: string;
  }
) => {
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: () => authApi.login(serverUrl, body),
    onSuccess: (res) => {
      const key = md5(serverUrl);
      login({ key, serverUrl });

      if (!localStorage.getItem('device_id')) {
        localStorage.setItem('device_id', nanoid());
      }

      localStorage.setItem(
        'authentication',
        JSON.stringify({
          accessToken: res.data.accessToken,
          isAuthenticated: true,
          key,
          refreshToken: res.data.refreshToken,
          serverUrl,
        })
      );
    },
  });
};

export const usePingServer = (server: string) => {
  return useQuery({
    enabled: !!server,
    queryFn: () => authApi.ping(server),
    queryKey: queryKeys.ping(server),
    retry: false,
  });
};
