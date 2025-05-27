import { CSSProperties, MouseEvent, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    RiAddBoxFill,
    RiAddCircleFill,
    RiAlbumFill,
    RiPlayFill,
    RiPlayListFill,
    RiShuffleFill,
    RiUserVoiceFill,
} from 'react-icons/ri';

import styles from './library-command-item.module.css';

import { Button } from '/@/shared/components/button/button';
import { Center } from '/@/shared/components/center/center';
import { Flex } from '/@/shared/components/flex/flex';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem } from '/@/shared/types/domain-types';
import { Play, PlayQueueAddOptions } from '/@/shared/types/types';

interface LibraryCommandItemProps {
    disabled?: boolean;
    handlePlayQueueAdd?: (options: PlayQueueAddOptions) => void;
    id: string;
    imageUrl: null | string;
    itemType: LibraryItem;
    subtitle?: string;
    title?: string;
}

export const LibraryCommandItem = ({
    disabled,
    handlePlayQueueAdd,
    id,
    imageUrl,
    itemType,
    subtitle,
    title,
}: LibraryCommandItemProps) => {
    const { t } = useTranslation();
    let Placeholder = RiAlbumFill;

    switch (itemType) {
        case LibraryItem.ALBUM:
            Placeholder = RiAlbumFill;
            break;
        case LibraryItem.ALBUM_ARTIST:
            Placeholder = RiUserVoiceFill;
            break;
        case LibraryItem.ARTIST:
            Placeholder = RiUserVoiceFill;
            break;
        case LibraryItem.PLAYLIST:
            Placeholder = RiPlayListFill;
            break;
        default:
            Placeholder = RiAlbumFill;
            break;
    }

    const handlePlay = useCallback(
        (e: MouseEvent, id: string, playType: Play) => {
            e.stopPropagation();
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

    return (
        <Flex
            gap="xl"
            justify="space-between"
            style={{ height: '40px', width: '100%' }}
        >
            <div
                className={styles.itemGrid}
                style={{ '--item-height': '40px' } as CSSProperties}
            >
                <div className={styles.imageWrapper}>
                    {imageUrl ? (
                        <img
                            alt="cover"
                            className={styles.image}
                            height={40}
                            src={imageUrl}
                            width={40}
                        />
                    ) : (
                        <Center
                            style={{
                                background: 'var(--theme-colors-surface)',
                                borderRadius: 'var(--theme-card-default-radius)',
                                height: `${40}px`,
                                width: `${40}px`,
                            }}
                        >
                            <Placeholder
                                color="var(--theme-colors-foreground-muted)"
                                size={35}
                            />
                        </Center>
                    )}
                </div>
                <div className={styles.metadataWrapper}>
                    <Text overflow="hidden">{title}</Text>
                    <Text
                        isMuted
                        overflow="hidden"
                    >
                        {subtitle}
                    </Text>
                </div>
            </div>
            <Flex
                align="center"
                gap="sm"
                justify="flex-end"
            >
                <Button
                    disabled={disabled}
                    onClick={(e) => handlePlay(e, id, Play.NOW)}
                    size="compact-md"
                    tooltip={{
                        label: t('player.play', { postProcess: 'sentenceCase' }),
                        openDelay: 500,
                    }}
                    variant="default"
                >
                    <RiPlayFill />
                </Button>
                {itemType !== LibraryItem.SONG && (
                    <Button
                        disabled={disabled}
                        onClick={(e) => handlePlay(e, id, Play.SHUFFLE)}
                        size="compact-md"
                        tooltip={{
                            label: t('player.shuffle', { postProcess: 'sentenceCase' }),
                            openDelay: 500,
                        }}
                        variant="default"
                    >
                        <RiShuffleFill />
                    </Button>
                )}
                <Button
                    disabled={disabled}
                    onClick={(e) => handlePlay(e, id, Play.LAST)}
                    size="compact-md"
                    tooltip={{
                        label: t('player.addLast', { postProcess: 'sentenceCase' }),

                        openDelay: 500,
                    }}
                    variant="default"
                >
                    <RiAddBoxFill />
                </Button>
                <Button
                    disabled={disabled}
                    onClick={(e) => handlePlay(e, id, Play.NEXT)}
                    size="compact-md"
                    tooltip={{
                        label: t('player.addNext', { postProcess: 'sentenceCase' }),
                        openDelay: 500,
                    }}
                    variant="default"
                >
                    <RiAddCircleFill />
                </Button>
            </Flex>
        </Flex>
    );
};
