import { useQuery } from '@tanstack/react-query';
import { api } from '@/renderer/api';
import { queryKeys } from '@/renderer/api/query-keys';

export const useUserDetail = (options: { userId: string }) => {
  const { data, error, isLoading } = useQuery({
    queryFn: () => api.users.getUserDetail({ userId: options.userId }),
    queryKey: queryKeys.users.detail(options.userId),
  });

  return {
    data,
    error,
    isLoading,
  };
};
