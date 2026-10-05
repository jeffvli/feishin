import { openModal } from '@mantine/modals';
import { useTranslation } from 'react-i18next';

import styles from './music-video-button.module.css';

import { type MusicVideo, useMusicVideo } from '/@/renderer/features/hermes-video/hooks/use-music-video';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { usePlayerSong } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';

// Streams the video with YouTube's official embedded player (privacy-enhanced domain). Nothing is downloaded.
const MusicVideoPlayer = ({ video }: { video: MusicVideo }) => (
    <div className={styles.frame}>
        <iframe
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            src={`https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title={video.title || 'Music video'}
        />
    </div>
);

// Shows up in the player bar only when Hermes Music has a music video for the current song.
export const MusicVideoButton = () => {
    const { t } = useTranslation();
    const song = usePlayerSong();
    const { mediaPause } = usePlayer();
    const { data: video } = useMusicVideo(song?.artistName, song?.name);

    if (!song || !video) return null;

    return (
        <ActionIcon
            icon="musicVideo"
            iconProps={{ size: 'lg' }}
            onClick={(e) => {
                e.stopPropagation();
                mediaPause(); // the video has its own sound
                openModal({
                    centered: true,
                    children: <MusicVideoPlayer video={video} />,
                    size: '80vw',
                    title: `${song.artistName} - ${song.name}`,
                });
            }}
            size="sm"
            tooltip={{ label: t('player.musicVideo'), openDelay: 0 }}
            variant="subtle"
        />
    );
};
