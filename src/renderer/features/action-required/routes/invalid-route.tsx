import { RiQuestionLine } from 'react-icons/ri';
import { useLocation, useNavigate } from 'react-router-dom';

import { AnimatedPage } from '/@/renderer/features/shared';
import { Button } from '/@/shared/components/button/button';
import { Center } from '/@/shared/components/center/center';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';

const InvalidRoute = () => {
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
                        <RiQuestionLine
                            color="var(--theme-colors-state-warning)"
                            size={30}
                        />
                        <Text size="xl">Page not found</Text>
                    </Group>
                    <Text>{location.pathname}</Text>
                    <Button
                        onClick={() => navigate(-1)}
                        variant="filled"
                    >
                        Go back
                    </Button>
                </Stack>
            </Center>
        </AnimatedPage>
    );
};

export default InvalidRoute;
