import { closeAllModals, openModal } from '@mantine/modals';
import { memo, ReactNode, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './library-header-bar.module.css';

import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { PlayButton } from '/@/renderer/features/shared/components/play-button';
import { PlayButtonGroup } from '/@/renderer/features/shared/components/play-button-group';
import { useCurrentServerId } from '/@/renderer/store';
import { Badge, BadgeProps } from '/@/shared/components/badge/badge';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import { LibraryItem, Song } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

interface LibraryHeaderBarProps {
    children: ReactNode;
}

const LibraryHeaderBarComponent = ({ children }: LibraryHeaderBarProps) => {
    return <div className={styles.headerContainer}>{children}</div>;
};

interface HeaderPlayButtonProps {
    className?: string;
    ids?: string[];
    itemType: LibraryItem;
    listQuery?: Record<string, any>;
    songs?: Song[];
}

interface TitleProps {
    children: ReactNode;
}

const HeaderPlayButton = ({
    className,
    ids,
    itemType,
    listQuery,
    songs,
    ...props
}: HeaderPlayButtonProps) => {
    const serverId = useCurrentServerId();
    const { t } = useTranslation();
    const player = usePlayer();

    const handlePlay = useCallback(
        (playType: Play) => {
            if (listQuery) {
                player.addToQueueByListQuery(serverId, listQuery, itemType, playType);
            } else if (ids) {
                player.addToQueueByFetch(serverId, ids, itemType, playType);
            } else if (songs) {
                player.addToQueueByData(songs, playType);
            }

            closeAllModals();
        },
        [listQuery, ids, songs, player, serverId, itemType],
    );

    const openPlayTypeModal = useCallback(() => {
        if (!serverId) return;

        openModal({
            children: <PlayButtonGroup onPlay={handlePlay} />,
            size: 'xs',
            title: t('player.play', { postProcess: 'titleCase' }),
        });
    }, [serverId, handlePlay, t]);

    return (
        <div className={styles.playButtonContainer}>
            <PlayButton className={className} onClick={openPlayTypeModal} {...props} />
        </div>
    );
};

const Title = ({ children }: TitleProps) => {
    return (
        <TextTitle fw={700} order={1} overflow="hidden">
            {children}
        </TextTitle>
    );
};

interface HeaderBadgeProps extends BadgeProps {
    isLoading?: boolean;
}

const HeaderBadge = ({ children, isLoading, ...props }: HeaderBadgeProps) => {
    return <Badge {...props}>{isLoading ? <Spinner /> : children}</Badge>;
};

export const LibraryHeaderBar = Object.assign(memo(LibraryHeaderBarComponent), {
    Badge: HeaderBadge,
    PlayButton: HeaderPlayButton,
    Title,
});
