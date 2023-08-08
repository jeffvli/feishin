import { useCallback } from 'react';
import { Group, Stack } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { RiExternalLinkLine } from 'react-icons/ri';
import { Button, Dialog, Text } from './components';
import packageJson from '../../package.json';

export const IsUpdatedDialog = () => {
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
                <Group noWrap>
                    <Button
                        component="a"
                        href={`https://github.com/jeffvli/feishin/releases/tag/v${version}`}
                        rightIcon={<RiExternalLinkLine />}
                        target="_blank"
                        variant="filled"
                        onClick={handleDismiss}
                    >
                        View release notes
                    </Button>
                    <Button
                        variant="default"
                        onClick={handleDismiss}
                    >
                        Dismiss
                    </Button>
                </Group>
            </Stack>
        </Dialog>
    );
};
