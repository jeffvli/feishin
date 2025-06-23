import { useLocalStorage } from '@mantine/hooks';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import packageJson from '../../package.json';

import { Button } from '/@/shared/components/button/button';
import { Dialog } from '/@/shared/components/dialog/dialog';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';

export function IsUpdatedDialog() {
    const { version } = packageJson;
    const { t } = useTranslation();

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
                <Text>{t('common.newVersion', { postProcess: 'sentenceCase', version })}</Text>
                <Group wrap="nowrap">
                    <Button
                        component="a"
                        href={`https://github.com/jeffvli/feishin/releases/tag/v${version}`}
                        onClick={handleDismiss}
                        rightSection={<Icon icon="externalLink" />}
                        target="_blank"
                        variant="filled"
                    >
                        {t('common.viewReleaseNotes', { postProcess: 'sentenceCase' })}
                    </Button>
                    <Button
                        onClick={handleDismiss}
                        variant="default"
                    >
                        {t('common.dismiss', { postProcess: 'titleCase' })}
                    </Button>
                </Group>
            </Stack>
        </Dialog>
    );
}
