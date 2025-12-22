import { closeAllModals, openModal } from '@mantine/modals';
import clsx from 'clsx';
import { forwardRef, ReactNode, Ref, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import styles from './library-header.module.css';

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
import { Center } from '/@/shared/components/center/center';
import { Group } from '/@/shared/components/group/group';
import { Image } from '/@/shared/components/image/image';
import { Rating } from '/@/shared/components/rating/rating';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

interface LibraryHeaderProps {
    children?: ReactNode;
    containerClassName?: string;
    imagePlaceholderUrl?: null | string;
    imageUrl?: null | string;
    item: { route: string; type: LibraryItem };
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

        const itemTypeString = () => {
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
            if (imageUrl && !isImageError) {
                const fullSized = imageUrl.replace(/&?(size|width|height)=\d+/, '');

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
                            <img
                                alt="cover"
                                src={fullSized}
                                style={{
                                    maxHeight: '100%',
                                    maxWidth: '100%',
                                }}
                            />
                        </Center>
                    ),
                    fullScreen: true,
                });
            }
        }, [imageUrl, isImageError]);

        return (
            <div className={clsx(styles.libraryHeader, containerClassName)} ref={ref}>
                <div
                    className={styles.imageSection}
                    onClick={() => openImage()}
                    onKeyDown={(event) =>
                        [' ', 'Enter', 'Spacebar'].includes(event.key) && openImage()
                    }
                    role="button"
                    style={{ cursor: 'pointer' }}
                    tabIndex={0}
                >
                    {!isImageError && (
                        <Image
                            alt="cover"
                            className={styles.image}
                            containerClassName={styles.image}
                            key={imageUrl}
                            loading="eager"
                            onError={onImageError}
                            src={imageUrl || ''}
                        />
                    )}
                </div>
                {title && (
                    <div className={styles.metadataSection}>
                        <Text
                            className={styles.itemType}
                            component={Link}
                            fw={600}
                            isLink
                            size="md"
                            style={{}}
                            to={item.route}
                            tt="uppercase"
                        >
                            {itemTypeString()}
                        </Text>
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

const calculateTitleSize = (title: string) => {
    const titleLength = title.length;
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

    return `clamp(1.75rem, ${baseSize}, 2.75rem)`;
};

interface LibraryHeaderMenuProps {
    favorite?: boolean;
    onFavorite?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    onMore?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    onPlay?: (type: Play) => void;
    onRating?: (rating: number) => void;
    onShuffle?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    rating?: number;
}

export const LibraryHeaderMenu = ({
    favorite,
    onFavorite,
    onMore,
    onPlay,
    onRating,
    rating,
}: LibraryHeaderMenuProps) => {
    const isMutatingRating = useIsMutatingRating();
    const isMutatingCreateFavorite = useIsMutatingCreateFavorite();
    const isMutatingDeleteFavorite = useIsMutatingDeleteFavorite();
    const isMutatingFavorite = isMutatingCreateFavorite || isMutatingDeleteFavorite;

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
