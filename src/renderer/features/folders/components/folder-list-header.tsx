import { useTranslation } from 'react-i18next';

import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { LibraryHeaderBar } from '/@/renderer/features/shared/components/library-header-bar';
import { useContainerQuery } from '/@/renderer/hooks';
import { Flex } from '/@/shared/components/flex/flex';
import { Stack } from '/@/shared/components/stack/stack';

export const FolderListHeader = (): JSX.Element => {
    const { t } = useTranslation();
    const cq = useContainerQuery();

    return (
        <Stack gap={0} ref={cq.ref}>
            <PageHeader>
                <Flex justify="space-between" w="100%">
                    <LibraryHeaderBar>
                        <LibraryHeaderBar.Title>
                            {t('page.folderList.title', { postProcess: 'titleCase' })}
                        </LibraryHeaderBar.Title>
                    </LibraryHeaderBar>
                </Flex>
            </PageHeader>
        </Stack>
    );
};
