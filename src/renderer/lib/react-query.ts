import {
  QueryClient,
  UseQueryOptions,
  UseMutationOptions,
  DefaultOptions,
  QueryCache,
} from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { PromiseValue } from 'type-fest';
import { toast } from '@/renderer/components';

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
    refetchOnWindowFocus: process.env.NODE_ENV === 'production',
    retry: process.env.NODE_ENV === 'production',
    staleTime: 1000 * 5,
    useErrorBoundary: true,
  },
};

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
  queryCache,
});

export type ExtractFnReturnType<FnType extends (...args: any) => any> =
  PromiseValue<ReturnType<FnType>>;

export type QueryConfig<QueryFnType extends (...args: any) => any> = Omit<
  UseQueryOptions<ExtractFnReturnType<QueryFnType>>,
  'queryKey' | 'queryFn'
>;

export type MutationConfig<MutationFnType extends (...args: any) => any> =
  UseMutationOptions<
    ExtractFnReturnType<MutationFnType>,
    AxiosError,
    Parameters<MutationFnType>[0]
  >;

export type QueryOptions<TResponse> = {
  cacheTime?: UseQueryOptions['cacheTime'];
  enabled?: UseQueryOptions['enabled'];
  onError?: (err: any) => void;
  onSuccess?: (data: any) => void;
  refetchInterval?: number;
  refetchIntervalInBackground?: UseQueryOptions['refetchIntervalInBackground'];
  refetchOnWindowFocus?: boolean;
  retry?: UseQueryOptions['retry'];
  retryDelay?: UseQueryOptions['retryDelay'];
  staleTime?: UseQueryOptions['staleTime'];
  useErrorBoundary?: any;
};
