import { useTranslation } from 'react-i18next';

import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { LibraryHeaderBar } from '/@/renderer/features/shared/components/library-header-bar';
import { Badge } from '/@/shared/components/badge/badge';
import { SpinnerIcon } from '/@/shared/components/spinner/spinner';
import { LibraryItem, Song } from '/@/shared/types/domain-types';

interface AlbumArtistDetailTopSongsListHeaderProps {
    data: Song[];
    itemCount?: number;
    title: string;
}

export const AlbumArtistDetailTopSongsListHeader = ({
    data,
    itemCount,
    title,
}: AlbumArtistDetailTopSongsListHeaderProps) => {
    const { t } = useTranslation();

    return (
        <PageHeader>
            <LibraryHeaderBar ignoreMaxWidth>
                <LibraryHeaderBar.PlayButton itemType={LibraryItem.SONG} songs={data} />
                <LibraryHeaderBar.Title order={2}>
                    {t('page.albumArtistDetail.topSongsFrom', {
                        postProcess: 'titleCase',
                        title,
                    })}
                </LibraryHeaderBar.Title>
                <Badge>
                    {itemCount === null || itemCount === undefined ? <SpinnerIcon /> : itemCount}
                </Badge>
            </LibraryHeaderBar>
        </PageHeader>
    );
};
