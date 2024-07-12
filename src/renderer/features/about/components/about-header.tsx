import { Stack, Flex } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '/@/renderer/components';
import { LibraryHeaderBar } from '/@/renderer/features/shared';
import { useContainerQuery } from '/@/renderer/hooks';
import { titleCase } from '/@/renderer/utils';

export const AboutHeader = () => {
    const { t } = useTranslation();
    const cq = useContainerQuery();
    return (
        <Stack
            ref={cq.ref}
            spacing={0}
        >
            <PageHeader backgroundColor="var(--titlebar-bg)">
                <Flex
                    justify="space-between"
                    w="100%"
                >
                    <LibraryHeaderBar>
                        <LibraryHeaderBar.Title>
                            {titleCase(t('page.about.title', { postProcess: 'titleCase' }))}
                        </LibraryHeaderBar.Title>
                    </LibraryHeaderBar>
                </Flex>
            </PageHeader>
        </Stack>
    );
};
