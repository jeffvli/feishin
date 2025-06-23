import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { AnimatedPage } from '/@/renderer/features/shared';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Center } from '/@/shared/components/center/center';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';

const InvalidRoute = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <AnimatedPage>
            <Center style={{ height: '100%', width: '100%' }}>
                <Stack>
                    <Group
                        justify="center"
                        wrap="nowrap"
                    >
                        <Icon
                            color="warn"
                            icon="error"
                        />
                        <Text size="xl">
                            {t('error.apiRouteError', { postProcess: 'sentenceCase' })}
                        </Text>
                    </Group>
                    <Text>{location.pathname}</Text>
                    <ActionIcon
                        icon="arrowLeftS"
                        onClick={() => navigate(-1)}
                        variant="filled"
                    />
                </Stack>
            </Center>
        </AnimatedPage>
    );
};

export default InvalidRoute;
