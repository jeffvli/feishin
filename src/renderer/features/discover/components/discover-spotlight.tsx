import { useTranslation } from 'react-i18next';

import styles from './discover-spotlight.module.css';

import { AlbumSpotlight } from '/@/renderer/features/discover/utils/album-spotlight';
import { listenBrainzUrl } from '/@/renderer/features/discover/utils/lb-adapters';
import {
    usePreviewActions,
    usePreviewPlayingId,
    usePreviewResolvingId,
} from '/@/renderer/features/preview/preview-store';
import { usePlaybackType } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import { Text } from '/@/shared/components/text/text';
import { PlayerType } from '/@/shared/types/types';

interface DiscoverSpotlightProps {
    album: AlbumSpotlight;
    title: string;
}

/**
 * One album, presented as a record rather than as a handful of loose suggestions.
 *
 * The only block on the page that is not a strip of cards, which is the point: three carousels
 * in a column read as one undifferentiated wall however good their contents are. It earns the
 * room by carrying something the carousels cannot, namely that several suggestions arrived
 * independently at the same release.
 *
 * Track numbers are the release's own running order, not decoration. They are the one place a
 * numbered marker belongs on this page, because the sequence is real information about the
 * record rather than a label applied to a list.
 */
export function DiscoverSpotlight(props: DiscoverSpotlightProps) {
    const { album, title } = props;
    const { t } = useTranslation();
    const playbackType = usePlaybackType();
    const playingId = usePreviewPlayingId();
    const resolvingId = usePreviewResolvingId();
    const { toggle } = usePreviewActions();

    // Same reasoning as the carousels: a preview on this machine can neither be heard
    // alongside jukebox playback nor duck it.
    const canPreview = playbackType !== PlayerType.JUKEBOX;

    return (
        <Stack gap="md">
            <TextTitle fw={700} isNoSelect order={3}>
                {title}
            </TextTitle>
            <div className={styles.panel}>
                {album.imageUrl ? (
                    <img alt="" className={styles.cover} loading="lazy" src={album.imageUrl} />
                ) : (
                    <div className={styles.cover} />
                )}
                <Stack gap="sm">
                    <Stack gap={2}>
                        <TextTitle fw={700} isNoSelect order={4}>
                            {album.albumName}
                        </TextTitle>
                        <Text isMuted size="sm">
                            {t('page.discover.spotlightSubtitle', {
                                artist: album.artistName,
                                count: album.tracks.length,
                            })}
                        </Text>
                    </Stack>
                    <ul className={styles.tracks}>
                        {album.tracks.map((track, index) => {
                            const url = listenBrainzUrl(track);

                            const name = (
                                <Text className={styles.name} size="sm">
                                    {track.title}
                                </Text>
                            );

                            return (
                                <li className={styles.track} key={track.id}>
                                    <Text className={styles.index} isMuted size="sm">
                                        {index + 1}
                                    </Text>
                                    {url ? (
                                        <a
                                            className={styles.link}
                                            href={url}
                                            rel="noopener noreferrer"
                                            target="_blank"
                                        >
                                            {name}
                                        </a>
                                    ) : (
                                        name
                                    )}
                                    <Group gap="xs">
                                        {canPreview && (
                                            <ActionIcon
                                                icon={
                                                    playingId === track.id
                                                        ? 'mediaPause'
                                                        : 'mediaPlay'
                                                }
                                                iconProps={{ size: 'sm' }}
                                                loading={resolvingId === track.id}
                                                onClick={() =>
                                                    void toggle(track.id, {
                                                        artistName: track.artistName,
                                                        title: track.title,
                                                        urlRels: track.urlRels,
                                                    })
                                                }
                                                size="sm"
                                                variant="transparent"
                                            />
                                        )}
                                    </Group>
                                </li>
                            );
                        })}
                    </ul>
                </Stack>
            </div>
        </Stack>
    );
}
