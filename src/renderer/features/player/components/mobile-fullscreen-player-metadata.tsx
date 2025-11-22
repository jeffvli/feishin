import clsx from 'clsx';
import { memo, MouseEvent } from 'react';

import styles from './mobile-fullscreen-player.module.css';

import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Group } from '/@/shared/components/group/group';
import { Rating } from '/@/shared/components/rating/rating';
import { Separator } from '/@/shared/components/separator/separator';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import { Text } from '/@/shared/components/text/text';
import { PlaybackSelectors } from '/@/shared/constants/playback-selectors';
import { QueueSong } from '/@/shared/types/domain-types';

interface MobileFullscreenPlayerMetadataProps {
    currentSong?: QueueSong;
    onToggleFavorite: (e: MouseEvent<HTMLButtonElement>) => void;
    onUpdateRating: (rating: number) => void;
    showRating?: boolean;
}

export const MobileFullscreenPlayerMetadata = memo(
    ({
        currentSong,
        onToggleFavorite,
        onUpdateRating,
        showRating,
    }: MobileFullscreenPlayerMetadataProps) => {
        const title = currentSong?.name;
        const artists = currentSong?.artists;
        const album = currentSong?.album;
        const container = currentSong?.container;
        const year = currentSong?.releaseYear;
        const isFavorite = currentSong?.userFavorite;
        const rating = currentSong?.userRating;

        const hasMetadata = container || year;

        return (
            <div className={styles.metadataContainer}>
                <div className={styles.titleRow}>
                    <TextTitle
                        className={PlaybackSelectors.songTitle}
                        fw={700}
                        order={2}
                        ta="center"
                    >
                        {title || '—'}
                    </TextTitle>
                </div>
                <Text className={clsx(PlaybackSelectors.songArtist)} size="md" truncate>
                    {artists?.map((a) => a.name).join(', ') || '—'}
                </Text>
                <Text className={clsx(PlaybackSelectors.songAlbum)} size="md" truncate>
                    {album || '—'}
                </Text>
                {hasMetadata && (
                    <Group align="center" className={styles.metadataRow} gap="xs" wrap="nowrap">
                        {container && <Text size="xs">{container}</Text>}
                        {year && (
                            <>
                                {container && <Separator />}
                                <Text size="xs">{year}</Text>
                            </>
                        )}
                    </Group>
                )}
                <Group align="center" className={styles.actionsRow} gap="xs">
                    <ActionIcon
                        icon="favorite"
                        iconProps={{
                            fill: isFavorite ? 'favorite' : undefined,
                            size: 'md',
                        }}
                        onClick={onToggleFavorite}
                        size="sm"
                        variant="subtle"
                    />
                    {showRating && (
                        <Rating onChange={onUpdateRating} size="sm" value={rating || 0} />
                    )}
                </Group>
            </div>
        );
    },
);

MobileFullscreenPlayerMetadata.displayName = 'MobileFullscreenPlayerMetadata';
