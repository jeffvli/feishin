import type {
    DefaultOptions,
    QueryOptions,
    UseInfiniteQueryOptions,
    UseMutationOptions,
    UseQueryOptions,
} from '@tanstack/react-query';

import { QueryCache, QueryClient } from '@tanstack/react-query';

import { toast } from '/@/shared/components/toast/toast';

const queryCache = new QueryCache({
    onError: (error: any, query) => {
        if (query.state.data !== undefined) {
            console.error(error);
            toast.show({ message: `${error.message}`, type: 'error' });
        }
    },
});

const queryConfig: DefaultOptions = {
    mutations: {
        retry: process.env.NODE_ENV === 'production' ? 3 : false,
    },
    queries: {
        gcTime: 1000 * 5, // 5 seconds
        refetchOnWindowFocus: false,
        retry: process.env.NODE_ENV === 'production',
        staleTime: 0, // 5 seconds
        throwOnError: (error: any) => {
            return error?.response?.status >= 500;
        },
    },
};

export const queryClient = new QueryClient({
    defaultOptions: queryConfig,
    queryCache,
});

export type InfiniteQueryHookArgs<T> = {
    options?: UseInfiniteQueryOptions;
    query: T;
    serverId: string | undefined;
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
    options?: UseQueryHookOptions;
    query: T;
    serverId: string;
};

type UseQueryHookOptions = {
    enabled?: boolean;
    gcTime?: QueryOptions['gcTime'];
    // initialData?: UseQueryOptions['initialData'];
    // initialDataUpdatedAt?: UseQueryOptions['initialDataUpdatedAt'];
    meta?: UseQueryOptions['meta'];
    networkMode?: UseQueryOptions['networkMode'];
    notifyOnChangeProps?: UseQueryOptions['notifyOnChangeProps'];
    placeholderData?: (prev: any) => any;
    // queryFn?: UseQueryOptions['queryFn'];
    queryKey?: UseQueryOptions['queryKey'];
    queryKeyHashFn?: UseQueryOptions['queryKeyHashFn'];
    refetchInterval?: number;
    refetchIntervalInBackground?: UseQueryOptions['refetchIntervalInBackground'];
    refetchOnMount?: boolean;
    refetchOnReconnect?: boolean;
    refetchOnWindowFocus?: boolean;
    retry?: UseQueryOptions['retry'];
    retryDelay?: UseQueryOptions['retryDelay'];
    retryOnMount?: UseQueryOptions['retryOnMount'];
    // select?: UseQueryOptions['select'];
    staleTime?: number;
    structuralSharing?: UseQueryOptions['structuralSharing'];
    subscribed?: UseQueryOptions['subscribed'];
    throwOnError?: boolean;
};
