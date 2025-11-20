import clsx from 'clsx';
import { motion } from 'motion/react';
import { memo } from 'react';

import styles from './mobile-fullscreen-player.module.css';

import { useFullScreenPlayerStore, useGeneralSettings } from '/@/renderer/store';
import { Image } from '/@/shared/components/image/image';
import { PlaybackSelectors } from '/@/shared/constants/playback-selectors';
import { QueueSong } from '/@/shared/types/domain-types';

const scaleImageUrl = (imageSize: number, url?: null | string) => {
    return url
        ?.replace(/&size=\d+/, `&size=${imageSize}`)
        .replace(/\?width=\d+/, `?width=${imageSize}`)
        .replace(/&height=\d+/, `&height=${imageSize}`);
};

interface MobileFullscreenPlayerAlbumArtProps {
    currentSong?: QueueSong;
}

export const MobileFullscreenPlayerAlbumArt = memo(
    ({ currentSong }: MobileFullscreenPlayerAlbumArtProps) => {
        const { albumArtRes } = useGeneralSettings();
        const { useImageAspectRatio } = useFullScreenPlayerStore();
        const imageSize = albumArtRes || 1000;
        const imageUrl = scaleImageUrl(imageSize, currentSong?.imageUrl);

        if (!imageUrl) {
            return null;
        }

        return (
            <div className={styles.imageContainer}>
                <motion.div
                    animate={{ opacity: 1, scale: 1 }}
                    className={clsx(styles.image, {
                        [styles.imageNativeAspectRatio]: useImageAspectRatio,
                    })}
                    initial={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                >
                    <Image
                        className={clsx(styles.albumImage, PlaybackSelectors.playerCoverArt)}
                        loading="eager"
                        src={imageUrl}
                        style={{
                            objectFit: useImageAspectRatio ? 'contain' : 'cover',
                            width: useImageAspectRatio ? 'auto' : '100%',
                        }}
                    />
                </motion.div>
            </div>
        );
    },
);

MobileFullscreenPlayerAlbumArt.displayName = 'MobileFullscreenPlayerAlbumArt';
