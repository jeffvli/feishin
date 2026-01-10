import { closeAllModals, openModal } from '@mantine/modals';
import clsx from 'clsx';
import { forwardRef, ReactNode, Ref, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import styles from './library-header.module.css';

import { getItemImageUrl, ItemImage } from '/@/renderer/components/item-image/item-image';
import { useIsPlayerFetching } from '/@/renderer/features/player/context/player-context';
import {
    PlayLastTextButton,
    PlayNextTextButton,
    PlayTextButton,
} from '/@/renderer/features/shared/components/play-button';
import { LONG_PRESS_PLAY_BEHAVIOR } from '/@/renderer/features/shared/components/play-button-group';
import { usePlayButtonClick } from '/@/renderer/features/shared/hooks/use-play-button-click';
import { useIsMutatingCreateFavorite } from '/@/renderer/features/shared/mutations/create-favorite-mutation';
import { useIsMutatingDeleteFavorite } from '/@/renderer/features/shared/mutations/delete-favorite-mutation';
import { useIsMutatingRating } from '/@/renderer/features/shared/mutations/set-rating-mutation';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Center } from '/@/shared/components/center/center';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { BaseImage } from '/@/shared/components/image/image';
import { Rating } from '/@/shared/components/rating/rating';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

interface LibraryHeaderProps {
    children?: ReactNode;
    containerClassName?: string;
    imagePlaceholderUrl?: null | string;
    imageUrl?: null | string;
    item: {
        children?: ReactNode;
        imageId?: null | string;
        imageUrl?: null | string;
        route: string;
        type?: LibraryItem;
    };
    loading?: boolean;
    title: string;
}

export const LibraryHeader = forwardRef(
    (
        { children, containerClassName, imageUrl, item, title }: LibraryHeaderProps,
        ref: Ref<HTMLDivElement>,
    ) => {
        const { t } = useTranslation();
        const [isImageError, setIsImageError] = useState<boolean | null>(false);

        const onImageError = () => {
            setIsImageError(true);
        };

        const itemTypeString = (): string => {
            switch (item.type) {
                case LibraryItem.ALBUM:
                    return t('entity.album', { count: 1 });
                case LibraryItem.ALBUM_ARTIST:
                    return t('entity.albumArtist', { count: 1 });
                case LibraryItem.ARTIST:
                    return t('entity.artist', { count: 1 });
                case LibraryItem.PLAYLIST:
                    return t('entity.playlist', { count: 1 });
                case LibraryItem.SONG:
                    return t('entity.track', { count: 1 });
                default:
                    return t('common.unknown');
            }
        };

        const openImage = useCallback(() => {
            const imageId = item.imageId;
            const itemType = item.type as LibraryItem;

            if (!imageId || !itemType) {
                return;
            }

            const imageUrl = getItemImageUrl({
                id: imageId,
                itemType,
            });

            if (!imageUrl) {
                console.error('No image URL found');
                return;
            }

            openModal({
                children: (
                    <Center
                        onClick={() => closeAllModals()}
                        style={{
                            cursor: 'pointer',
                            height: 'calc(100vh - 80px)',
                            width: '100%',
                        }}
                    >
                        <BaseImage
                            alt="cover"
                            src={imageUrl}
                            style={{
                                maxHeight: '100%',
                                maxWidth: '100%',
                                objectFit: 'contain',
                            }}
                            unloaderIcon="emptyImage"
                        />
                    </Center>
                ),
                fullScreen: true,
            });
        }, [item.imageId, item.type]);

        return (
            <div className={clsx(styles.libraryHeader, containerClassName)} ref={ref}>
                <div
                    className={styles.imageSection}
                    onClick={() => {
                        console.log('openImage');
                        openImage();
                    }}
                    onKeyDown={(event) =>
                        [' ', 'Enter', 'Spacebar'].includes(event.key) && openImage()
                    }
                    role="button"
                    style={{ cursor: 'pointer' }}
                    tabIndex={0}
                >
                    {!isImageError && (
                        <ItemImage
                            className={styles.image}
                            containerClassName={styles.image}
                            id={item.imageId}
                            itemType={item.type as LibraryItem}
                            onError={onImageError}
                            src={imageUrl || ''}
                            type="header"
                        />
                    )}
                </div>
                {title && (
                    <div className={styles.metadataSection}>
                        {item.children ? (
                            <div className={styles.itemType}>{item.children}</div>
                        ) : (
                            <Text
                                className={styles.itemType}
                                component={Link}
                                fw={600}
                                isLink
                                size="md"
                                to={item.route}
                                tt="uppercase"
                            >
                                {itemTypeString()}
                            </Text>
                        )}

                        <h1
                            className={styles.title}
                            style={{
                                fontSize: calculateTitleSize(title),
                            }}
                        >
                            {title}
                        </h1>
                        {children}
                    </div>
                )}
            </div>
        );
    },
);

const isAsianCharacter = (char: string): boolean => {
    const codePoint = char.codePointAt(0);

    if (!codePoint) return false;

    // CJK Unified Ideographs: U+4E00–U+9FFF
    if (codePoint >= 0x4e00 && codePoint <= 0x9fff) return true;

    // Hiragana: U+3040–U+309F
    if (codePoint >= 0x3040 && codePoint <= 0x309f) return true;

    // Katakana: U+30A0–U+30FF
    if (codePoint >= 0x30a0 && codePoint <= 0x30ff) return true;

    // CJK Extension A: U+3400–U+4DBF
    if (codePoint >= 0x3400 && codePoint <= 0x4dbf) return true;

    // CJK Compatibility Ideographs: U+F900–U+FAFF
    if (codePoint >= 0xf900 && codePoint <= 0xfaff) return true;

    // Fullwidth forms (some Asian characters): U+FF00–U+FFEF
    // Only count fullwidth letters/numbers as Asian
    if (codePoint >= 0xff01 && codePoint <= 0xff5e) return true;

    return false;
};

const calculateWeightedLength = (str: string): number => {
    let length = 0;
    for (const char of str) {
        length += isAsianCharacter(char) ? 2.5 : 1;
    }
    return length;
};

const calculateTitleSize = (title: string) => {
    const titleLength = calculateWeightedLength(title);
    let baseSize = '3dvw';

    if (titleLength > 20) {
        baseSize = '2.5dvw';
    }

    if (titleLength > 30) {
        baseSize = '2.25dvw';
    }

    if (titleLength > 40) {
        baseSize = '2dvw';
    }

    if (titleLength > 50) {
        baseSize = '1.875dvw';
    }

    if (titleLength > 60) {
        baseSize = '1.75dvw';
    }

    if (titleLength > 70) {
        baseSize = '1.5dvw';
    }

    if (titleLength > 80) {
        baseSize = '1.4dvw';
    }

    if (titleLength > 90) {
        baseSize = '1.3dvw';
    }

    return `clamp(1.75rem, ${baseSize}, 2.75rem)`;
};

interface LibraryHeaderMenuProps {
    favorite?: boolean;
    onArtistRadio?: () => void;
    onFavorite?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    onMore?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    onPlay?: (type: Play) => void;
    onRating?: (rating: number) => void;
    onShuffle?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    rating?: number;
}

export const LibraryHeaderMenu = ({
    favorite,
    onArtistRadio,
    onFavorite,
    onMore,
    onPlay,
    onRating,
    rating,
}: LibraryHeaderMenuProps) => {
    const { t } = useTranslation();
    const isMutatingRating = useIsMutatingRating();
    const isMutatingCreateFavorite = useIsMutatingCreateFavorite();
    const isMutatingDeleteFavorite = useIsMutatingDeleteFavorite();
    const isMutatingFavorite = isMutatingCreateFavorite || isMutatingDeleteFavorite;
    const isPlayerFetching = useIsPlayerFetching();

    const handlePlayNow = usePlayButtonClick({
        onClick: () => {
            onPlay?.(Play.NOW);
        },
        onLongPress: () => {
            onPlay?.(LONG_PRESS_PLAY_BEHAVIOR[Play.NOW]);
        },
    });

    const handlePlayNext = usePlayButtonClick({
        onClick: () => {
            onPlay?.(Play.NEXT);
        },
        onLongPress: () => {
            onPlay?.(LONG_PRESS_PLAY_BEHAVIOR[Play.NEXT]);
        },
    });

    const handlePlayLast = usePlayButtonClick({
        onClick: () => {
            onPlay?.(Play.LAST);
        },
        onLongPress: () => {
            onPlay?.(LONG_PRESS_PLAY_BEHAVIOR[Play.LAST]);
        },
    });

    return (
        <div className={styles.libraryHeaderMenu}>
            <Group wrap="nowrap">
                {onPlay && <PlayTextButton {...handlePlayNow.handlers} {...handlePlayNow.props} />}
                {onPlay && (
                    <PlayNextTextButton {...handlePlayNext.handlers} {...handlePlayNext.props} />
                )}
                {onPlay && (
                    <PlayLastTextButton {...handlePlayLast.handlers} {...handlePlayLast.props} />
                )}
                {onArtistRadio && (
                    <Button
                        leftSection={
                            isPlayerFetching ? (
                                <Spinner color="white" />
                            ) : (
                                <Icon icon="radio" size="lg" />
                            )
                        }
                        onClick={onArtistRadio}
                        size="md"
                        variant="transparent"
                    >
                        {t('player.artistRadio', { postProcess: 'sentenceCase' })}
                    </Button>
                )}
            </Group>
            <Group gap="sm" wrap="nowrap">
                {onRating && (
                    <Rating
                        onChange={onRating}
                        readOnly={isMutatingRating}
                        size="lg"
                        value={rating || 0}
                    />
                )}
                {onFavorite && (
                    <ActionIcon
                        disabled={isMutatingFavorite}
                        icon="favorite"
                        iconProps={{
                            fill: favorite ? 'primary' : undefined,
                        }}
                        onClick={onFavorite}
                        size="lg"
                        variant="transparent"
                    />
                )}
                {onMore && (
                    <ActionIcon
                        icon="ellipsisHorizontal"
                        onClick={onMore}
                        size="lg"
                        variant="transparent"
                    />
                )}
            </Group>
        </div>
    );
};
