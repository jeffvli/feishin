import type {
    DefaultOptions,
    UseInfiniteQueryOptions,
    UseMutationOptions,
    UseQueryOptions,
} from '@tanstack/react-query';

import { QueryCache, QueryClient } from '@tanstack/react-query';

import { toast } from '/@/shared/components/toast/toast';

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
        cacheTime: 1000 * 60 * 3,
        onError: (err) => {
            console.error('react query error:', err);
        },
        refetchOnWindowFocus: false,
        retry: process.env.NODE_ENV === 'production',
        staleTime: 1000 * 5,
        useErrorBoundary: (error: any) => {
            return error?.response?.status >= 500;
        },
    },
};

export const queryClient = new QueryClient({
    defaultOptions: queryConfig,
    queryCache,
});

export type InfiniteQueryOptions = {
    cacheTime?: UseInfiniteQueryOptions['cacheTime'];
    enabled?: UseInfiniteQueryOptions['enabled'];
    keepPreviousData?: UseInfiniteQueryOptions['keepPreviousData'];
    meta?: UseInfiniteQueryOptions['meta'];
    onError?: (err: any) => void;
    onSettled?: any;
    onSuccess?: any;
    queryKey?: UseInfiniteQueryOptions['queryKey'];
    refetchInterval?: number;
    refetchIntervalInBackground?: UseInfiniteQueryOptions['refetchIntervalInBackground'];
    refetchOnWindowFocus?: boolean;
    retry?: UseInfiniteQueryOptions['retry'];
    retryDelay?: UseInfiniteQueryOptions['retryDelay'];
    staleTime?: UseInfiniteQueryOptions['staleTime'];
    suspense?: UseInfiniteQueryOptions['suspense'];
    useErrorBoundary?: boolean;
};

export type MutationHookArgs = {
    options?: MutationOptions;
};

export type MutationOptions = {
    mutationKey: UseMutationOptions['mutationKey'];
    onError?: (err: any) => void;
    onSettled?: any;
    onSuccess?: any;
    retry?: UseQueryOptions['retry'];
    retryDelay?: UseQueryOptions['retryDelay'];
    useErrorBoundary?: boolean;
};

export type QueryHookArgs<T> = {
    options?: QueryOptions;
    query: T;
    serverId: string | undefined;
};

export type QueryOptions = {
    cacheTime?: UseQueryOptions['cacheTime'];
    enabled?: UseQueryOptions['enabled'];
    keepPreviousData?: UseQueryOptions['keepPreviousData'];
    meta?: UseQueryOptions['meta'];
    onError?: (err: any) => void;
    onSettled?: any;
    onSuccess?: any;
    queryKey?: UseQueryOptions['queryKey'];
    refetchInterval?: number;
    refetchIntervalInBackground?: UseQueryOptions['refetchIntervalInBackground'];
    refetchOnWindowFocus?: boolean;
    retry?: UseQueryOptions['retry'];
    retryDelay?: UseQueryOptions['retryDelay'];
    staleTime?: UseQueryOptions['staleTime'];
    suspense?: UseQueryOptions['suspense'];
    useErrorBoundary?: boolean;
};
