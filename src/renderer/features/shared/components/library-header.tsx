import { closeAllModals, openModal } from '@mantine/modals';
import { AutoTextSize } from 'auto-text-size';
import clsx from 'clsx';
import { forwardRef, ReactNode, Ref, useCallback, useState } from 'react';

import styles from './library-header.module.css';

import { useGeneralSettings } from '/@/renderer/store';
import { Center } from '/@/shared/components/center/center';
import { Image } from '/@/shared/components/image/image';
import { LibraryItem } from '/@/shared/types/domain-types';

interface LibraryHeaderProps {
    background?: string;
    blur?: number;
    children?: ReactNode;
    imagePlaceholderUrl?: null | string;
    imageUrl?: null | string;
    item: { route: string; type: LibraryItem };
    loading?: boolean;
    title: string;
}

export const LibraryHeader = forwardRef(
    (
        { background, blur, children, imageUrl, item, title }: LibraryHeaderProps,
        ref: Ref<HTMLDivElement>,
    ) => {
        const [isImageError, setIsImageError] = useState<boolean | null>(false);
        const { albumBackground } = useGeneralSettings();

        const onImageError = () => {
            setIsImageError(true);
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
                    className={styles.background}
                    style={{ background, filter: `blur(${blur ?? 0}rem)` }}
                />
                <div
                    className={clsx(styles.backgroundOverlay, {
                        [styles.opaqueOverlay]: albumBackground,
                    })}
                />
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
                        <h1 className={styles.title}>
                            <AutoTextSize maxFontSizePx={80} mode="box">
                                {title}
                            </AutoTextSize>
                        </h1>
                        {children}
                    </div>
                )}
            </div>
        );
    },
);
