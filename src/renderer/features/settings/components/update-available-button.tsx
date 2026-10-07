import {
    installHermesUpdate,
    useHermesUpdate,
} from '/@/renderer/features/hermes-update/components/hermes-update-button';
import { Button } from '/@/shared/components/button/button';

// Hermes Music edition: shown once an update has downloaded; clicking restarts into it.
export const UpdateAvailableButton = () => {
    const update = useHermesUpdate();

    if (update?.state !== 'ready') {
        return null;
    }

    return (
        <Button onClick={installHermesUpdate} size="compact-sm" variant="filled">
            Update to v{update.version}
        </Button>
    );
};
