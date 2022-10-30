import { Text } from '@/renderer/components';
import { useAuthStore } from '@/renderer/store';

export const ServerCredentialRequired = () => {
  const currentServer = useAuthStore((state) => state.currentServer);

  return (
    <>
      <Text size="lg">
        The selected server &apos;{currentServer?.name}&apos; requires an
        additional login to access.
      </Text>
      <Text size="lg">
        Add your credentials in the &apos;manage servers&apos; menu or switch to
        a different server.
      </Text>
    </>
  );
};
