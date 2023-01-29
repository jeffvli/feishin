import { Text } from '/@/renderer/components';
import { useCurrentServer } from '/@/renderer/store';

export const ServerCredentialRequired = () => {
  const currentServer = useCurrentServer();

  return (
    <>
      <Text>
        The selected server &apos;{currentServer?.name}&apos; requires an additional login to
        access.
      </Text>
      <Text>
        Add your credentials in the &apos;manage servers&apos; menu or switch to a different server.
      </Text>
    </>
  );
};
