import { CSSProperties, useCallback, useState } from 'react';

import styles from './library-command-item.module.css';

import { ItemImage } from '/@/renderer/components/item-image/item-image';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import {
    LONG_PRESS_PLAY_BEHAVIOR,
    PlayTooltip,
} from '/@/renderer/features/shared/components/play-button-group';
import { usePlayButtonClick } from '/@/renderer/features/shared/hooks/use-play-button-click';
import { useCurrentServer } from '/@/renderer/store';
import { ActionIcon, ActionIconGroup } from '/@/shared/components/action-icon/action-icon';
import { Flex } from '/@/shared/components/flex/flex';
import { Text } from '/@/shared/components/text/text';
import { ExplicitStatus, LibraryItem, Song } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

const createPlayKeyDownHandler = (
    playType: Play,
    disabled: boolean,
    onPlay: (type: Play) => void,
) => {
    return (e: React.KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            if (!disabled) {
                onPlay(playType);
            }
        } else if (e.key === 'Tab') {
            e.stopPropagation();
        }
    };
};

interface LibraryCommandItemProps {
    disabled?: boolean;
    explicitStatus?: ExplicitStatus | null;
    id: string;
    imageId: null | string;
    imageUrl: null | string;
    isHighlighted?: boolean;
    itemType: LibraryItem;
    song?: Song;
    subtitle?: string;
    title?: string;
}

export const LibraryCommandItem = ({
    disabled,
    explicitStatus,
    id,
    imageId,
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
                    <ItemImage
                        alt="cover"
                        className={styles.image}
                        explicitStatus={explicitStatus ?? song?.explicitStatus ?? null}
                        height={40}
                        id={imageId}
                        itemType={itemType}
                        src={imageUrl}
                        type="table"
                        width={40}
                    />
                </div>
                <div className={styles.metadataWrapper}>
                    <Text overflow="hidden">{title}</Text>
                    <Text isMuted overflow="hidden" size="sm">
                        {subtitle}
                    </Text>
                </div>
            </div>
            {showControls && (
                <ActionIconGroup className={styles.controls}>
                    <PlayTooltip disabled={disabled} type={Play.NOW}>
                        <ActionIcon
                            icon="mediaPlay"
                            size="xs"
                            variant="default"
                            {...handlePlayNow.handlers}
                            {...handlePlayNow.props}
                            onKeyDown={createPlayKeyDownHandler(
                                Play.NOW,
                                Boolean(disabled ?? handlePlayNow.props.disabled),
                                handlePlay,
                            )}
                        />
                    </PlayTooltip>
                    <PlayTooltip disabled={disabled} type={Play.NEXT}>
                        <ActionIcon
                            icon="mediaPlayNext"
                            size="xs"
                            variant="default"
                            {...handlePlayNext.handlers}
                            {...handlePlayNext.props}
                            onKeyDown={createPlayKeyDownHandler(
                                Play.NEXT,
                                Boolean(disabled ?? handlePlayNext.props.disabled),
                                handlePlay,
                            )}
                        />
                    </PlayTooltip>
                    <PlayTooltip disabled={disabled} type={Play.LAST}>
                        <ActionIcon
                            icon="mediaPlayLast"
                            size="xs"
                            variant="default"
                            {...handlePlayLast.handlers}
                            {...handlePlayLast.props}
                            onKeyDown={createPlayKeyDownHandler(
                                Play.LAST,
                                Boolean(disabled ?? handlePlayLast.props.disabled),
                                handlePlay,
                            )}
                        />
                    </PlayTooltip>
                </ActionIconGroup>
            )}
        </Flex>
    );
};
