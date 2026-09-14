import { RiRestartLine } from 'react-icons/ri';

import { useAuthFailed, useReconnect } from '/@/remote/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';

// Shell only renders this while `!connected` (a plain transient drop
// auto-retries on its own, see store/index.ts) — so there's no "already
// connected" state left to show here, just which flavor of "not connected"
// this is.
export const ReconnectButton = () => {
    const authFailed = useAuthFailed();
    const reconnect = useReconnect();

    return (
        <ActionIcon
            onClick={() => reconnect()}
            tooltip={{
                label: authFailed
                    ? 'Authentication failed. Reconnect.'
                    : 'Not connected. Reconnect.',
            }}
            variant="default"
        >
            <RiRestartLine color="var(--theme-colors-foreground)" size={30} />
        </ActionIcon>
    );
};
