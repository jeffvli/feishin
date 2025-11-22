import { closeAllModals, openModal } from '@mantine/modals';
import { forwardRef, ReactNode, Ref, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import styles from './library-header.module.css';

import {
    WidePlayButton,
    WideShuffleButton,
} from '/@/renderer/features/shared/components/play-button';
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

interface LibraryHeaderProps {
    children?: ReactNode;
    imagePlaceholderUrl?: null | string;
    imageUrl?: null | string;
    item: { route: string; type: LibraryItem };
    loading?: boolean;
    title: string;
}

export const LibraryHeader = forwardRef(
    ({ children, imageUrl, item, title }: LibraryHeaderProps, ref: Ref<HTMLDivElement>) => {
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
            <div className={styles.libraryHeader} ref={ref}>
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
                            to={item.route}
                            tt="uppercase"
                        >
                            {itemTypeString()}
                        </Text>
                        <h1 className={styles.title}>{title}</h1>
                        {children}
                    </div>
                )}
            </div>
        );
    },
);

interface LibraryHeaderMenuProps {
    favorite?: boolean;
    onFavorite?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    onMore?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    onPlay?: (e: React.MouseEvent<HTMLButtonElement>) => void;
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
    onShuffle,
    rating,
}: LibraryHeaderMenuProps) => {
    const isMutatingRating = useIsMutatingRating();
    const isMutatingCreateFavorite = useIsMutatingCreateFavorite();
    const isMutatingDeleteFavorite = useIsMutatingDeleteFavorite();

    return (
        <div className={styles.libraryHeaderMenu}>
            <Group wrap="nowrap">
                {onPlay && <WidePlayButton onClick={onPlay} />}
                {onShuffle && <WideShuffleButton onClick={onShuffle} />}
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
                        disabled={isMutatingCreateFavorite || isMutatingDeleteFavorite}
                        icon="favorite"
                        iconProps={{
                            fill: favorite ? 'favorite' : undefined,
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
