import { RemoteButton } from '/@/remote/components/buttons/remote-button';
import { useConnected, useReconnect } from '/@/remote/store';
import { RiRestartLine } from 'react-icons/ri';

export const ReconnectButton = () => {
  const connected = useConnected();
  const reconnect = useReconnect();

  return (
    <RemoteButton
      $active={!connected}
      mr={5}
      size="xl"
      tooltip={connected ? 'Reconnect' : 'Not connected. Reconnect.'}
      variant="default"
      onClick={() => reconnect()}
    >
      <RiRestartLine size={30} />
    </RemoteButton>
  );
};
