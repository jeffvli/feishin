import type { UseQueryOptions, DefaultOptions } from '@tanstack/react-query';
import { QueryClient, QueryCache } from '@tanstack/react-query';
import { toast } from '/@/renderer/components';

const queryCache = new QueryCache({
  onError: (error: any, query) => {
    if (query.state.data !== undefined) {
      toast.show({ message: `${error.message}`, type: 'error' });
    }
  },
});

const queryConfig: DefaultOptions = {
  mutations: {
    retry: process.env.NODE_ENV === 'production',
  },
  queries: {
    cacheTime: 1000 * 60 * 15,
    onError: (err) => {
      console.error(err);
    },
    refetchOnWindowFocus: false,
    retry: process.env.NODE_ENV === 'production',
    staleTime: 1000 * 5,
    useErrorBoundary: true,
  },
};

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
  queryCache,
});

export type QueryOptions = {
  cacheTime?: UseQueryOptions['cacheTime'];
  enabled?: UseQueryOptions['enabled'];
  keepPreviousData?: UseQueryOptions['keepPreviousData'];
  meta?: UseQueryOptions['meta'];
  onError?: (err: any) => void;
  onSettled?: any;
  onSuccess?: any;
  refetchInterval?: number;
  refetchIntervalInBackground?: UseQueryOptions['refetchIntervalInBackground'];
  refetchOnWindowFocus?: boolean;
  retry?: UseQueryOptions['retry'];
  retryDelay?: UseQueryOptions['retryDelay'];
  staleTime?: UseQueryOptions['staleTime'];
  suspense?: UseQueryOptions['suspense'];
  useErrorBoundary?: boolean;
};
