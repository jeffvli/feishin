import { useQuery } from '@tanstack/react-query';
import { Suspense, useEffect, useMemo } from 'react';

import { useListContext } from '/@/renderer/context/list-context';
import { radioQueries } from '/@/renderer/features/radio/api/radio-api';
import { RadioListItems } from '/@/renderer/features/radio/components/radio-list-items';
import { useSearchTermFilter } from '/@/renderer/features/shared/hooks/use-search-term-filter';
import { useSortByFilter } from '/@/renderer/features/shared/hooks/use-sort-by-filter';
import { useSortOrderFilter } from '/@/renderer/features/shared/hooks/use-sort-order-filter';
import { searchLibraryItems } from '/@/renderer/features/shared/utils';
import { useCurrentServer } from '/@/renderer/store';
import { sortRadioList } from '/@/shared/api/utils';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { LibraryItem, RadioListSort, SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

export const RadioListContent = () => {
    const server = useCurrentServer();
    const { setItemCount } = useListContext();
    const { searchTerm } = useSearchTermFilter();
    const { sortBy } = useSortByFilter<RadioListSort>(RadioListSort.NAME, ItemListKey.RADIO);
    const { sortOrder } = useSortOrderFilter(SortOrder.ASC, ItemListKey.RADIO);

    const radioListQuery = useQuery({
        ...radioQueries.list({
            query: undefined,
            serverId: server?.id || '',
        }),
    });

    const filteredAndSortedRadioStations = useMemo(() => {
        let stations = radioListQuery.data || [];

        if (searchTerm) {
            stations = searchLibraryItems(stations, searchTerm, LibraryItem.RADIO_STATION);
        }

        if (sortBy && sortOrder) {
            stations = sortRadioList(stations, sortBy, sortOrder);
        }

        return stations;
    }, [radioListQuery.data, searchTerm, sortBy, sortOrder]);

    useEffect(() => {
        setItemCount?.(filteredAndSortedRadioStations.length || 0);
    }, [filteredAndSortedRadioStations.length, setItemCount]);

    if (radioListQuery.isLoading) {
        return <Spinner container />;
    }

    return (
        <Suspense fallback={<Spinner container />}>
            <ScrollArea>
                <Stack p="md">
                    <RadioListItems data={filteredAndSortedRadioStations} />
                </Stack>
            </ScrollArea>
        </Suspense>
    );
};
