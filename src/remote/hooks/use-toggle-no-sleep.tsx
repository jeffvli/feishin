import { useCallback } from 'react';
import { useNoSleepContext } from '/@/remote/context/nosleep-context';
import { toast } from '/@/renderer/components';

export const useToggleNoSleep = () => {
    const { noSleep, enabled, setEnabled } = useNoSleepContext();

    const toggle = useCallback(async () => {
        if (!noSleep) return;

        if (enabled) {
            noSleep.disable();
            setEnabled!(false);
        } else {
            try {
                await noSleep.enable();
                setEnabled!(true);
            } catch (error) {
                toast.error({
                    message: (error as Error).message,
                    title: 'Failed to disable screen lock',
                });
            }
        }
    }, [enabled, noSleep, setEnabled]);

    return toggle;
};
