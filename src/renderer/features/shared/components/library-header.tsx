import { Group } from '@mantine/core';
import { forwardRef, ReactNode, Ref } from 'react';
import { Link } from 'react-router-dom';
import { SimpleImg } from 'react-simple-img';
import styles from './library-header.module.scss';
import { LibraryItem } from '/@/renderer/api/types';
import { Text } from '/@/renderer/components';
import { ItemImagePlaceholder } from '/@/renderer/features/shared/components/item-image-placeholder';

interface LibraryHeaderProps {
    background: string;
    children?: ReactNode;
    imagePlaceholderUrl?: string | null;
    imageUrl?: string | null;
    item: { route: string; type: LibraryItem };
    title: string;
}

export const LibraryHeader = forwardRef(
    (
        { imageUrl, imagePlaceholderUrl, background, title, item, children }: LibraryHeaderProps,
        ref: Ref<HTMLDivElement>,
    ) => {
        return (
            <div
                ref={ref}
                className={styles.libraryHeader}
            >
                <div
                    className={styles.background}
                    style={{ background }}
                />
                <div className={styles.backgroundOverlay} />
                <div className={styles.imageSection}>
                    {imageUrl ? (
                        <SimpleImg
                            alt="cover"
                            className={styles.image}
                            placeholder={imagePlaceholderUrl || 'var(--placeholder-bg)'}
                            src={imageUrl}
                            style={{ height: '' }}
                        />
                    ) : (
                        <ItemImagePlaceholder itemType={item.type} />
                    )}
                </div>
                <div className={styles.metadataSection}>
                    <Group>
                        <Text
                            $link
                            component={Link}
                            to={item.route}
                            tt="uppercase"
                            weight={600}
                        >
                            {item.type}
                        </Text>
                    </Group>
                    <h1 className={styles.title}>{title}</h1>
                    {children}
                </div>
            </div>
        );
    },
);
