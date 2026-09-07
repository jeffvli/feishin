import { useCallback, useState } from 'react';

import { toast } from '/@/shared/components/toast/toast';

/**
 * Runs an acked send (useConfirmedSend/useSendAcked) and tracks which item
 * triggered it, so an action sheet can show a spinner on that item and
 * disable the rest until the desktop confirms the operation actually
 * finished — without this, tapping "Next" gave no sign anything had
 * happened, which invited a repeat tap that could queue the same track
 * twice before the first send had even landed.
 */
export function useAckedAction() {
    const [pendingKey, setPendingKey] = useState<null | string>(null);

    const run = useCallback((key: string, promise: Promise<void>, onSuccess: () => void) => {
        setPendingKey(key);
        promise.then(
            () => {
                setPendingKey(null);
                onSuccess();
            },
            (error: Error) => {
                setPendingKey(null);
                toast.error({ message: error.message, title: 'Action failed' });
            },
        );
    }, []);

    return { pendingKey, run };
}
