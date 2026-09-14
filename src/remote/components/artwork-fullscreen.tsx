import { AnimatePresence, motion } from 'motion/react';

import styles from './artwork-fullscreen.module.css';

import { PlayerImage } from '/@/remote/components/player-image';
import playerImageStyles from '/@/remote/components/player-image.module.css';
import { Icon } from '/@/shared/components/icon/icon';
import { Text } from '/@/shared/components/text/text';

interface ArtworkFullscreenProps {
    album?: null | string;
    artist?: null | string;
    onClose: () => void;
    opened: boolean;
    src: null | string;
    title: null | string;
}

export const ArtworkFullscreen = ({
    album,
    artist,
    onClose,
    opened,
    src,
    title,
}: ArtworkFullscreenProps) => {
    return (
        <AnimatePresence>
            {opened && src && (
                <motion.div
                    animate={{ opacity: 1 }}
                    className={styles.overlay}
                    exit={{ opacity: 0 }}
                    initial={{ opacity: 0 }}
                    onClick={onClose}
                    transition={{ duration: 0.2 }}
                >
                    <button
                        aria-label="Close"
                        className={styles['close-button']}
                        onClick={onClose}
                        type="button"
                    >
                        <Icon icon="x" size="lg" />
                    </button>
                    <PlayerImage className={playerImageStyles.fullscreen} src={src} />
                    {(title || artist || album) && (
                        <div className={styles.info}>
                            {title && (
                                <Text className={styles['info-line']} fw={700} size="lg">
                                    {title}
                                </Text>
                            )}
                            {artist && (
                                <Text className={styles['info-line']} isMuted>
                                    {artist}
                                </Text>
                            )}
                            {album && (
                                <Text className={styles['info-line']} isMuted size="sm">
                                    {album}
                                </Text>
                            )}
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
