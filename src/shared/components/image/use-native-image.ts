import { useEffect, useMemo, useRef, useState } from 'react';

import { ImageRequest } from '/@/shared/types/domain-types';

type FetchPriority = 'auto' | 'high' | 'low';

interface NativeImageState {
    displaySrc?: string;
    status: 'error' | 'idle' | 'loaded' | 'loading';
}

interface PendingRequest {
    controller: AbortController;
    promise: Promise<string>;
    subscribers: number;
}

interface UseNativeImageArgs {
    enabled: boolean;
    fetchPriority?: FetchPriority;
    onFetchError?: () => void;
    request?: ImageRequest | null;
}

const MAX_CACHE_ENTRIES = 500;

const cachedObjectUrls = new Map<string, string>();
const pendingRequests = new Map<string, PendingRequest>();

export function useNativeImage({
    enabled,
    fetchPriority,
    onFetchError,
    request,
}: UseNativeImageArgs) {
    const onFetchErrorRef = useRef(onFetchError);
    const [state, setState] = useState<NativeImageState>({ status: 'idle' });

    const signature = useMemo(() => (request ? getRequestSignature(request) : null), [request]);

    onFetchErrorRef.current = onFetchError;

    useEffect(() => {
        if (!request || !signature) {
            setState({ status: 'idle' });
            return;
        }

        const cachedObjectUrl = getCachedObjectUrl(signature);

        if (cachedObjectUrl) {
            setState({ displaySrc: cachedObjectUrl, status: 'loaded' });
            return;
        }

        if (!enabled) {
            setState((currentState) =>
                currentState.displaySrc
                    ? { ...currentState, status: 'loaded' }
                    : { status: 'idle' },
            );
            return;
        }

        let isActive = true;
        setState({ status: 'loading' });

        const pending = acquireRequest(request, signature, fetchPriority);

        pending.promise
            .then((objectUrl) => {
                if (isActive) {
                    setState({ displaySrc: objectUrl, status: 'loaded' });
                }
            })
            .catch(() => {
                if (!isActive) {
                    return;
                }

                setState({ status: 'error' });
                onFetchErrorRef.current?.();
            });

        return () => {
            isActive = false;
            releaseRequest(signature, pending);
        };
    }, [enabled, fetchPriority, request, signature]);

    return {
        displaySrc: state.displaySrc,
        isError: state.status === 'error',
        isLoaded: state.status === 'loaded',
        isLoading: state.status === 'loading',
    };
}

function acquireRequest(request: ImageRequest, signature: string, fetchPriority?: FetchPriority) {
    const pending =
        pendingRequests.get(signature) ?? startRequest(request, signature, fetchPriority);

    pending.subscribers += 1;

    return pending;
}

function cacheObjectUrl(signature: string, objectUrl: string) {
    cachedObjectUrls.set(signature, objectUrl);

    // Dropping least-recent entries first
    for (const [oldestSignature, oldestObjectUrl] of cachedObjectUrls) {
        if (cachedObjectUrls.size <= MAX_CACHE_ENTRIES) {
            break;
        }

        cachedObjectUrls.delete(oldestSignature);
        URL.revokeObjectURL(oldestObjectUrl);
    }
}

function getCachedObjectUrl(signature: string) {
    const objectUrl = cachedObjectUrls.get(signature);

    if (objectUrl) {
        cachedObjectUrls.delete(signature);
        cachedObjectUrls.set(signature, objectUrl);
    }

    return objectUrl;
}

function getRequestSignature(request: ImageRequest) {
    return JSON.stringify({
        cacheKey: request.cacheKey,
        credentials: request.credentials,
        headers: request.headers,
        url: request.url,
    });
}

function releaseRequest(signature: string, pending: PendingRequest) {
    pending.subscribers -= 1;

    if (pending.subscribers > 0) {
        return;
    }

    pending.controller.abort();

    if (pendingRequests.get(signature) === pending) {
        pendingRequests.delete(signature);
    }
}

function startRequest(request: ImageRequest, signature: string, fetchPriority?: FetchPriority) {
    const controller = new AbortController();

    const init = {
        credentials: request.credentials,
        headers: request.headers,
        signal: controller.signal,
    } as RequestInit & { priority?: FetchPriority };

    if (fetchPriority) {
        init.priority = fetchPriority;
    }

    const promise = fetch(request.url, init).then(async (response) => {
        if (!response.ok) {
            throw new Error(`Failed to load image: ${response.status}`);
        }

        const blob = await response.blob();
        const expectedLength = response.headers.get('content-length');

        // Guarding against incomplete blobs / malformed data
        if (expectedLength && !response.headers.has('content-encoding')) {
            if (blob.size !== Number(expectedLength)) {
                throw new Error('Incomplete image response');
            }
        }

        const objectUrl = URL.createObjectURL(blob);
        cacheObjectUrl(signature, objectUrl);

        return objectUrl;
    });

    const pending: PendingRequest = { controller, promise, subscribers: 0 };
    pendingRequests.set(signature, pending);

    void promise
        .catch(() => undefined)
        .finally(() => {
            if (pendingRequests.get(signature) === pending) {
                pendingRequests.delete(signature);
            }
        });

    return pending;
}
