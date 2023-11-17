import { RemoteButton } from '/@/remote/components/buttons/remote-button';
import { LuMonitor, LuMonitorOff } from 'react-icons/lu';
import { useNoSleepContext } from '/@/remote/context/nosleep-context';
import { useToggleNoSleep } from '/@/remote/hooks/use-toggle-no-sleep';

export const SleepButton = () => {
    const { enabled } = useNoSleepContext();
    const toggleNoSleep = useToggleNoSleep();

    return (
        <RemoteButton
            tooltip={enabled ? 'Enable screen lock' : 'Disable screen lock'}
            onClick={toggleNoSleep}
        >
            {enabled ? <LuMonitorOff size={30} /> : <LuMonitor size={30} />}
        </RemoteButton>
    );
};
