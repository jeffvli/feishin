import { useLocalStorage } from '@mantine/hooks';
import { useCallback } from 'react';
import { RiExternalLinkLine } from 'react-icons/ri';

import packageJson from '../../package.json';

import { Button } from '/@/shared/components/button/button';
import { Dialog } from '/@/shared/components/dialog/dialog';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';

export function IsUpdatedDialog() {
    const { version } = packageJson;

    const [value, setValue] = useLocalStorage({ key: 'version' });

    const handleDismiss = useCallback(() => {
        setValue(version);
    }, [setValue, version]);

    return (
        <Dialog
            opened={value !== version}
            position={{ bottom: '5rem', right: '1rem' }}
            styles={{
                root: {
                    marginBottom: '50px',
                    right: '1rem',
                },
            }}
        >
            <Stack>
                <Text>A new version of Feishin has been installed ({version})</Text>
                <Group wrap="nowrap">
                    <Button
                        component="a"
                        href={`https://github.com/jeffvli/feishin/releases/tag/v${version}`}
                        onClick={handleDismiss}
                        rightSection={<RiExternalLinkLine />}
                        target="_blank"
                        variant="filled"
                    >
                        View release notes
                    </Button>
                    <Button
                        onClick={handleDismiss}
                        variant="default"
                    >
                        Dismiss
                    </Button>
                </Group>
            </Stack>
        </Dialog>
    );
}
