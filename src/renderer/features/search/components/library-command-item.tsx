import { CSSProperties, SyntheticEvent, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './library-command-item.module.css';

import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Image } from '/@/shared/components/image/image';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem } from '/@/shared/types/domain-types';
import { Play, PlayQueueAddOptions } from '/@/shared/types/types';

interface LibraryCommandItemProps {
    disabled?: boolean;
    handlePlayQueueAdd?: (options: PlayQueueAddOptions) => void;
    id: string;
    imageUrl: null | string;
    isHighlighted?: boolean;
    itemType: LibraryItem;
    subtitle?: string;
    title?: string;
}

export const LibraryCommandItem = ({
    disabled,
    handlePlayQueueAdd,
    id,
    imageUrl,
    isHighlighted,
    itemType,
    subtitle,
    title,
}: LibraryCommandItemProps) => {
    const { t } = useTranslation();

    const handlePlay = useCallback(
        (e: SyntheticEvent, id: string, playType: Play) => {
            e.stopPropagation();
            e.preventDefault();
            handlePlayQueueAdd?.({
                byItemType: {
                    id: [id],
                    type: itemType,
                },
                playType,
            });
        },
        [handlePlayQueueAdd, itemType],
    );

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
                <Group align="center" gap="sm" justify="flex-end" wrap="nowrap">
                    <ActionIcon
                        disabled={disabled}
                        icon="mediaPlay"
                        onClick={(e) => handlePlay(e, id, Play.NOW)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handlePlay(e, id, Play.NOW);
                            }
                        }}
                        size="xs"
                        tabIndex={disabled ? -1 : 0}
                        tooltip={{
                            label: t('player.play', { postProcess: 'sentenceCase' }),
                            openDelay: 500,
                        }}
                        variant="subtle"
                    />
                    {itemType !== LibraryItem.SONG && (
                        <ActionIcon
                            disabled={disabled}
                            icon="mediaShuffle"
                            onClick={(e) => handlePlay(e, id, Play.SHUFFLE)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handlePlay(e, id, Play.SHUFFLE);
                                }
                            }}
                            size="xs"
                            tabIndex={disabled ? -1 : 0}
                            tooltip={{
                                label: t('player.shuffle', { postProcess: 'sentenceCase' }),
                                openDelay: 500,
                            }}
                            variant="subtle"
                        />
                    )}
                    <ActionIcon
                        disabled={disabled}
                        icon="mediaPlayLast"
                        onClick={(e) => handlePlay(e, id, Play.LAST)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handlePlay(e, id, Play.LAST);
                            }
                        }}
                        size="xs"
                        tabIndex={disabled ? -1 : 0}
                        tooltip={{
                            label: t('player.addLast', { postProcess: 'sentenceCase' }),

                            openDelay: 500,
                        }}
                        variant="subtle"
                    />
                    <ActionIcon
                        disabled={disabled}
                        icon="mediaPlayNext"
                        onClick={(e) => handlePlay(e, id, Play.NEXT)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handlePlay(e, id, Play.NEXT);
                            }
                        }}
                        size="xs"
                        tabIndex={disabled ? -1 : 0}
                        tooltip={{
                            label: t('player.addNext', { postProcess: 'sentenceCase' }),
                            openDelay: 500,
                        }}
                        variant="subtle"
                    />
                </Group>
            )}
        </Flex>
    );
};
