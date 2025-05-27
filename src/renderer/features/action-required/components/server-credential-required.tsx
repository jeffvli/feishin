import { useCurrentServer } from '/@/renderer/store';
import { Text } from '/@/shared/components/text/text';

export const ServerCredentialRequired = () => {
    const currentServer = useCurrentServer();

    return (
        <>
            <Text>
                The selected server &apos;{currentServer?.name}&apos; requires an additional login
                to access.
            </Text>
            <Text>
                Add your credentials in the &apos;manage servers&apos; menu or switch to a different
                server.
            </Text>
        </>
    );
};
