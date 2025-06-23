import type { FallbackProps } from 'react-error-boundary';

import { useTranslation } from 'react-i18next';
import { useRouteError } from 'react-router';

import styles from './error-fallback.module.css';

import { Button } from '/@/shared/components/button/button';
import { Center } from '/@/shared/components/center/center';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';

export const ErrorFallback = ({ resetErrorBoundary }: FallbackProps) => {
    const error = useRouteError() as any;
    const { t } = useTranslation();

    return (
        <div className={styles.container}>
            <Center style={{ height: '100vh' }}>
                <Stack style={{ maxWidth: '50%' }}>
                    <Group gap="xs">
                        <Icon
                            fill="error"
                            icon="error"
                            size="lg"
                        />
                        <Text size="lg">{t('error.genericError')}</Text>
                    </Group>
                    <Text>{error?.message}</Text>
                    <Button
                        onClick={resetErrorBoundary}
                        variant="filled"
                    >
                        {t('common.reload')}
                    </Button>
                </Stack>
            </Center>
        </div>
    );
};
