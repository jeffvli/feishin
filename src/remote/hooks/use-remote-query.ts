import { nanoid } from 'nanoid/non-secure';
import { useEffect, useRef, useState } from 'react';

import { useSend } from '/@/remote/store';
import { ClientEvent } from '/@/shared/types/remote-types';

interface RemoteQueryResponse<TItem> {
    hasMore?: boolean;
    items: TItem[];
    requestId: null | string;
}

interface UseRemoteQueryOptions<TItem> {
    event: 'albums-request' | 'playlists-request' | 'radio-request' | 'tracks-request';
    pageSize?: number;
    // Radio has no search/pagination — a single one-shot fetch on mount.
    paginated?: boolean;
    response: RemoteQueryResponse<TItem>;
    searchTerm?: string;
}

/**
 * Shared request/response plumbing for Tracks/Albums/Playlists/Radio browsing —
 * generates a requestId per request, discards responses that don't match the
 * most recently issued request for the current search/page (so a slow
 * response to an earlier keystroke can't clobber a newer search's results),
 * and accumulates pages locally (the store only ever holds the latest
 * response, not the running list).
 */
export function useRemoteQuery<TItem>({
    event,
    pageSize = 30,
    paginated = true,
    response,
    searchTerm,
}: UseRemoteQueryOptions<TItem>) {
    const send = useSend();
    const requestIdRef = useRef('');
    const modeRef = useRef<'append' | 'replace'>('replace');
    const [items, setItems] = useState<TItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const sendRequest = (requestId: string, startIndex: number) => {
        setIsLoading(true);
        if (paginated) {
            send({ event, limit: pageSize, requestId, searchTerm, startIndex } as ClientEvent);
        } else {
            send({ event, requestId } as ClientEvent);
        }
    };

    // New search (or first mount): reset and fetch from the start.
    useEffect(() => {
        const requestId = nanoid();
        requestIdRef.current = requestId;
        modeRef.current = 'replace';
        setItems([]);
        sendRequest(requestId, 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [event, searchTerm]);

    useEffect(() => {
        if (!response.requestId || response.requestId !== requestIdRef.current) return;
        setIsLoading(false);
        setItems((prev) =>
            modeRef.current === 'replace' ? response.items : [...prev, ...response.items],
        );
    }, [response]);

    const loadMore = () => {
        if (!paginated || isLoading) return;
        const requestId = nanoid();
        requestIdRef.current = requestId;
        modeRef.current = 'append';
        sendRequest(requestId, items.length);
    };

    return {
        hasMore: paginated ? (response.hasMore ?? false) : false,
        isLoading,
        items,
        loadMore,
    };
}
