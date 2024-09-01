import { forwardRef, ReactNode, Ref, useState } from 'react';
import { Group } from '@mantine/core';
import { AutoTextSize } from 'auto-text-size';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import styles from './library-header.module.scss';
import { LibraryItem } from '/@/renderer/api/types';
import { Text } from '/@/renderer/components';
import { ItemImagePlaceholder } from '/@/renderer/features/shared/components/item-image-placeholder';
import { useGeneralSettings } from '/@/renderer/store';

interface LibraryHeaderProps {
    background: string;
    blur?: number;
    children?: ReactNode;
    imagePlaceholderUrl?: string | null;
    imageUrl?: string | null;
    item: { route: string; type: LibraryItem };
    title: string;
}

export const LibraryHeader = forwardRef(
    (
        {
            imageUrl,
            imagePlaceholderUrl,
            background,
            blur,
            title,
            item,
            children,
        }: LibraryHeaderProps,
        ref: Ref<HTMLDivElement>,
    ) => {
        const { t } = useTranslation();
        const [isImageError, setIsImageError] = useState<boolean | null>(false);
        const { albumBackground } = useGeneralSettings();

        const onImageError = () => {
            setIsImageError(true);
        };

        const itemTypeString = () => {
            switch (item.type) {
                case LibraryItem.ALBUM:
                    return t('entity.album', { count: 1 });
                case LibraryItem.ARTIST:
                    return t('entity.artist', { count: 1 });
                case LibraryItem.ALBUM_ARTIST:
                    return t('entity.albumArtist', { count: 1 });
                case LibraryItem.PLAYLIST:
                    return t('entity.playlist', { count: 1 });
                case LibraryItem.SONG:
                    return t('entity.track', { count: 1 });
                default:
                    return t('common.unknown');
            }
        };

        return (
            <div
                ref={ref}
                className={styles.libraryHeader}
            >
                <div
                    className={styles.background}
                    style={{ background, filter: `blur(${blur ?? 0}rem)` }}
                />
                <div
                    className={clsx(styles.backgroundOverlay, {
                        [styles.opaqueOverlay]: albumBackground,
                    })}
                />
                <div className={styles.imageSection}>
                    {imageUrl && !isImageError ? (
                        <img
                            alt="cover"
                            className={styles.image}
                            placeholder={imagePlaceholderUrl || 'var(--placeholder-bg)'}
                            src={imageUrl}
                            style={{ height: '' }}
                            onError={onImageError}
                        />
                    ) : (
                        <ItemImagePlaceholder itemType={item.type} />
                    )}
                </div>
                <div className={styles.metadataSection}>
                    <Group>
                        <h2>
                            <Text
                                $link
                                component={Link}
                                to={item.route}
                                tt="uppercase"
                                weight={600}
                            >
                                {itemTypeString()}
                            </Text>
                        </h2>
                    </Group>
                    <h1 className={styles.title}>
                        <AutoTextSize mode="box">{title}</AutoTextSize>
                    </h1>
                    {children}
                </div>
            </div>
        );
    },
);
