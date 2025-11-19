import { useTranslation } from 'react-i18next';

import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { LibraryHeaderBar } from '/@/renderer/features/shared/components/library-header-bar';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { Badge } from '/@/shared/components/badge/badge';
import { SpinnerIcon } from '/@/shared/components/spinner/spinner';
import { QueueSong } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

interface AlbumArtistDetailTopSongsListHeaderProps {
    data: QueueSong[];
    itemCount?: number;
    title: string;
}

export const AlbumArtistDetailTopSongsListHeader = ({
    data,
    itemCount,
    title,
}: AlbumArtistDetailTopSongsListHeaderProps) => {
    const { t } = useTranslation();
    const { addToQueueByData } = usePlayer();
    const playButtonBehavior = usePlayButtonBehavior();

    const handlePlay = async (playType: Play) => {
        addToQueueByData(data, playType);
    };

    return (
        <PageHeader p="1rem">
            <LibraryHeaderBar>
                <LibraryHeaderBar.PlayButton onClick={() => handlePlay(playButtonBehavior)} />
                <LibraryHeaderBar.Title>
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
