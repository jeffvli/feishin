import { useCallback, useMemo, useState } from 'react';

import { RadioRow, RadioRowSharedProps } from '/@/remote/components/radio-row';
import { VirtualRowList } from '/@/remote/components/virtual-row-list';
import { useRemoteQuery } from '/@/remote/hooks/use-remote-query';
import { useSend } from '/@/remote/store';
import { useRadioResponse } from '/@/remote/store/library';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { useDebouncedValue } from '/@/shared/hooks/use-debounced-value';
import { RemoteRadioItem } from '/@/shared/types/remote-types';

export const RadioPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 300);
    const send = useSend();
    const response = useRadioResponse();

    const { hasMore, isLoading, items, loadMore } = useRemoteQuery<RemoteRadioItem>({
        event: 'radio-request',
        response,
        searchTerm: debouncedSearchTerm || undefined,
    });

    const handlePlay = useCallback(
        (station: RemoteRadioItem) => send({ event: 'play-radio', id: station.id }),
        [send],
    );

    const rowProps = useMemo<RadioRowSharedProps>(
        () => ({ items, onPlay: handlePlay }),
        [items, handlePlay],
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flexShrink: 0, padding: 'var(--theme-spacing-md)' }}>
                <TextInput
                    onChange={(e) => setSearchTerm(e.currentTarget.value)}
                    placeholder="Search radio stations…"
                    value={searchTerm}
                />
            </div>
            <div
                style={{
                    display: 'flex',
                    flex: 1,
                    flexDirection: 'column',
                    minHeight: 0,
                    padding: '0 var(--theme-spacing-md) var(--theme-spacing-md)',
                }}
            >
                <VirtualRowList<RadioRowSharedProps>
                    emptyMessage="No radio stations found"
                    hasMore={hasMore}
                    isLoading={isLoading}
                    loadMore={loadMore}
                    resetKey={debouncedSearchTerm ?? ''}
                    rowComponent={RadioRow}
                    rowCount={rowProps.items.length}
                    rowProps={rowProps}
                />
            </div>
        </div>
    );
};
