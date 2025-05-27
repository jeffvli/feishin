import { RiRestartLine } from 'react-icons/ri';

import { RemoteButton } from '/@/remote/components/buttons/remote-button';
import { useConnected, useReconnect } from '/@/remote/store';

export const ReconnectButton = () => {
    const connected = useConnected();
    const reconnect = useReconnect();

    return (
        <RemoteButton
            isActive={!connected}
            mr={5}
            onClick={() => reconnect()}
            size="xl"
            tooltip={{
                label: connected ? 'Reconnect' : 'Not connected. Reconnect.',
            }}
            variant="default"
        >
            <RiRestartLine size={30} />
        </RemoteButton>
    );
};
