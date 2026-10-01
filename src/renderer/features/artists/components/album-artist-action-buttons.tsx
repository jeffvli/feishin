import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useIsPlayerFetching } from '/@/renderer/features/player/context/player-context';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Spinner } from '/@/shared/components/spinner/spinner';

interface AlbumArtistActionButtonsProps {
    artistDiscographyLink: string;
    artistSongsLink: string;
    onArtistRadio?: () => void;
}

export const AlbumArtistActionButtons = ({
    artistDiscographyLink,
    artistSongsLink,
    onArtistRadio,
}: AlbumArtistActionButtonsProps) => {
    const { t } = useTranslation();
    const isPlayerFetching = useIsPlayerFetching();

    return (
        <Group gap="lg" wrap="wrap">
            <Button
                component={Link}
                p={0}
                size="compact-md"
                to={artistDiscographyLink}
                variant="transparent"
            >
                {String(t('page.albumArtistDetail.viewDiscography')).toUpperCase()}
            </Button>
            <Button
                component={Link}
                p={0}
                size="compact-md"
                to={artistSongsLink}
                variant="transparent"
            >
                {String(t('page.albumArtistDetail.viewAllTracks')).toUpperCase()}
            </Button>
            {onArtistRadio && (
                <Button
                    disabled={isPlayerFetching}
                    leftSection={
                        isPlayerFetching ? (
                            <Spinner color="white" size={16} />
                        ) : (
                            <Icon icon="radio" size="lg" />
                        )
                    }
                    onClick={onArtistRadio}
                    p={0}
                    size="compact-md"
                    variant="transparent"
                >
                    {String(t('player.artistRadio')).toUpperCase()}
                </Button>
            )}
        </Group>
    );
};
