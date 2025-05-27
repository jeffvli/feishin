import { useTranslation } from 'react-i18next';
import { RiAddBoxFill, RiAddCircleFill, RiMoreFill, RiPlayFill } from 'react-icons/ri';

import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { LibraryHeaderBar } from '/@/renderer/features/shared';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { Button } from '/@/shared/components/button/button';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { Paper } from '/@/shared/components/paper/paper';
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
    const handlePlayQueueAdd = usePlayQueueAdd();
    const playButtonBehavior = usePlayButtonBehavior();

    const handlePlay = async (playType: Play) => {
        handlePlayQueueAdd?.({
            byData: data,
            playType,
        });
    };

    return (
        <PageHeader p="1rem">
            <LibraryHeaderBar>
                <LibraryHeaderBar.PlayButton onClick={() => handlePlay(playButtonBehavior)} />
                <LibraryHeaderBar.Title>
                    {t('page.albumArtistDetail.topSongsFrom', { title })}
                </LibraryHeaderBar.Title>
                <Paper
                    fw="600"
                    px="1rem"
                    py="0.3rem"
                    radius="sm"
                >
                    {itemCount === null || itemCount === undefined ? <SpinnerIcon /> : itemCount}
                </Paper>
                <DropdownMenu position="bottom-start">
                    <DropdownMenu.Target>
                        <Button
                            fw="600"
                            size="compact-md"
                            variant="subtle"
                        >
                            <RiMoreFill size={15} />
                        </Button>
                    </DropdownMenu.Target>
                    <DropdownMenu.Dropdown>
                        <DropdownMenu.Item
                            leftSection={<RiPlayFill />}
                            onClick={() => handlePlay(Play.NOW)}
                        >
                            {t('player.play', { postProcess: 'sentenceCase' })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            leftSection={<RiAddBoxFill />}
                            onClick={() => handlePlay(Play.LAST)}
                        >
                            {t('player.addLast', { postProcess: 'sentenceCase' })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            leftSection={<RiAddCircleFill />}
                            onClick={() => handlePlay(Play.NEXT)}
                        >
                            {t('player.addNext', { postProcess: 'sentenceCase' })}
                        </DropdownMenu.Item>
                    </DropdownMenu.Dropdown>
                </DropdownMenu>
            </LibraryHeaderBar>
        </PageHeader>
    );
};
