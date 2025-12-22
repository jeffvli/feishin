import { useTranslation } from 'react-i18next';

import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { LibraryHeaderBar } from '/@/renderer/features/shared/components/library-header-bar';

export const NowPlayingHeader = () => {
    const { t } = useTranslation();

    return (
        <PageHeader>
            <LibraryHeaderBar ignoreMaxWidth>
                <LibraryHeaderBar.Title>
                    {t('page.sidebar.nowPlaying', { postProcess: 'titleCase' })}
                </LibraryHeaderBar.Title>
            </LibraryHeaderBar>
        </PageHeader>
    );
};
