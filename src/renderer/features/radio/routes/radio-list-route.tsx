import { useMemo, useState } from 'react';

import { ListContext } from '/@/renderer/context/list-context';
import { RadioListContent } from '/@/renderer/features/radio/components/radio-list-content';
import { RadioListHeader } from '/@/renderer/features/radio/components/radio-list-header';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { PageErrorBoundary } from '/@/renderer/features/shared/components/page-error-boundary';
import { ItemListKey } from '/@/shared/types/types';

const RadioListRoute = () => {
    const pageKey = ItemListKey.RADIO;

    const [itemCount, setItemCount] = useState<number | undefined>(undefined);

    const providerValue = useMemo(() => {
        return {
            id: undefined,
            itemCount,
            pageKey,
            setItemCount,
        };
    }, [itemCount, pageKey, setItemCount]);

    return (
        <AnimatedPage>
            <ListContext.Provider value={providerValue}>
                <RadioListHeader />
                <RadioListContent />
            </ListContext.Provider>
        </AnimatedPage>
    );
};

const RadioListRouteWithBoundary = () => {
    return (
        <PageErrorBoundary>
            <RadioListRoute />
        </PageErrorBoundary>
    );
};

export default RadioListRouteWithBoundary;

