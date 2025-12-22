import { CSSProperties, useCallback, useState } from 'react';

import styles from './library-command-item.module.css';

import { usePlayer } from '/@/renderer/features/player/context/player-context';
import {
    LONG_PRESS_PLAY_BEHAVIOR,
    PlayTooltip,
} from '/@/renderer/features/shared/components/play-button-group';
import { usePlayButtonClick } from '/@/renderer/features/shared/hooks/use-play-button-click';
import { useCurrentServer } from '/@/renderer/store';
import { ActionIcon, ActionIconGroup } from '/@/shared/components/action-icon/action-icon';
import { Flex } from '/@/shared/components/flex/flex';
import { Image } from '/@/shared/components/image/image';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem, Song } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

interface LibraryCommandItemProps {
    disabled?: boolean;
    id: string;
    imageUrl: null | string;
    isHighlighted?: boolean;
    itemType: LibraryItem;
    song?: Song;
    subtitle?: string;
    title?: string;
}

export const LibraryCommandItem = ({
    disabled,
    id,
    imageUrl,
    isHighlighted,
    itemType,
    song,
    subtitle,
    title,
}: LibraryCommandItemProps) => {
    const { addToQueueByData, addToQueueByFetch } = usePlayer();
    const server = useCurrentServer();

    const handlePlay = useCallback(
        (playType: Play) => {
            if (!server.id) return;

            // Use addToQueueByData for songs when we have the song data
            if (itemType === LibraryItem.SONG && song) {
                addToQueueByData([song], playType);
            } else {
                addToQueueByFetch(server.id, [id], itemType, playType);
            }
        },
        [addToQueueByData, addToQueueByFetch, id, itemType, server.id, song],
    );

    const handlePlayNext = usePlayButtonClick({
        onClick: () => {
            handlePlay(Play.NEXT);
        },
        onLongPress: () => {
            handlePlay(LONG_PRESS_PLAY_BEHAVIOR[Play.NEXT]);
        },
    });

    const handlePlayNow = usePlayButtonClick({
        onClick: () => {
            handlePlay(Play.NOW);
        },
        onLongPress: () => {
            handlePlay(LONG_PRESS_PLAY_BEHAVIOR[Play.NOW]);
        },
    });

    const handlePlayLast = usePlayButtonClick({
        onClick: () => {
            handlePlay(Play.LAST);
        },
        onLongPress: () => {
            handlePlay(LONG_PRESS_PLAY_BEHAVIOR[Play.LAST]);
        },
    });

    const [isHovered, setIsHovered] = useState(false);

    const showControls = isHighlighted || isHovered;

    return (
        <Flex
            gap="xl"
            justify="space-between"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ height: '40px', width: '100%' }}
        >
            <div className={styles.itemGrid} style={{ '--item-height': '40px' } as CSSProperties}>
                <div className={styles.imageWrapper}>
                    <Image
                        alt="cover"
                        className={styles.image}
                        height={40}
                        src={imageUrl || ''}
                        width={40}
                    />
                </div>
                <div className={styles.metadataWrapper}>
                    <Text overflow="hidden">{title}</Text>
                    <Text isMuted overflow="hidden">
                        {subtitle}
                    </Text>
                </div>
            </div>
            {showControls && (
                <ActionIconGroup>
                    <PlayTooltip disabled={disabled} type={Play.NOW}>
                        <ActionIcon
                            icon="mediaPlay"
                            variant="subtle"
                            {...handlePlayNow.handlers}
                            {...handlePlayNow.props}
                        />
                    </PlayTooltip>
                    <PlayTooltip disabled={disabled} type={Play.NEXT}>
                        <ActionIcon
                            icon="mediaPlayNext"
                            variant="subtle"
                            {...handlePlayNext.handlers}
                            {...handlePlayNext.props}
                        />
                    </PlayTooltip>
                    <PlayTooltip disabled={disabled} type={Play.LAST}>
                        <ActionIcon
                            icon="mediaPlayLast"
                            variant="subtle"
                            {...handlePlayLast.handlers}
                            {...handlePlayLast.props}
                        />
                    </PlayTooltip>
                </ActionIconGroup>
            )}
        </Flex>
    );
};
