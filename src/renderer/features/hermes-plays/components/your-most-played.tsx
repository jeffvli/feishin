import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import styles from './your-most-played.module.css';

import { ItemImage } from '/@/renderer/components/item-image/item-image';
import {
    type PlayEntry,
    usePlayCountStore,
} from '/@/renderer/features/hermes-plays/store/play-count.store';
import { getSongById } from '/@/renderer/features/player/utils';
import { addToQueueByData } from '/@/renderer/store/player.store';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { LibraryItem } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

// Home: the songs you play most on this computer (replaces the server-wide "Most played").
export const YourMostPlayed = () => {
    const plays = usePlayCountStore((state) => state.plays);
    const queryClient = useQueryClient();
    const top = useMemo(
        () =>
            Object.values(plays)
                .sort((a, b) => b.count - a.count || b.last - a.last)
                .slice(0, 30),
        [plays],
    );

    const play = (entry: PlayEntry) =>
        getSongById({ id: entry.id, queryClient, serverId: entry.serverId })
            .then((res) => addToQueueByData(Play.NOW, res.items))
            .catch(() => toast.error({ message: `${entry.name} isn't on your music server` }));

    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <Text fw={700} size="xl">
                    Your most played
                </Text>
                <Text isMuted size="sm">
                    Counted on this computer
                </Text>
            </div>
            {!top.length && (
                <Text isMuted size="sm">
                    Play some music and the songs you play most will show up here.
                </Text>
            )}
            <div className={styles.row}>
                {top.map((entry) => (
                    <button
                        className={styles.card}
                        key={entry.id}
                        onClick={() => play(entry)}
                        title={`Play ${entry.name}`}
                        type="button"
                    >
                        <div className={styles.cover}>
                            <ItemImage
                                className={styles.coverImage}
                                containerClassName={styles.coverImage}
                                id={entry.imageId}
                                itemType={LibraryItem.SONG}
                                serverId={entry.serverId}
                                type="table"
                            />
                            <span className={styles.count}>{entry.count}x</span>
                        </div>
                        <Text fw={600} size="sm" truncate>
                            {entry.name}
                        </Text>
                        <Text isMuted size="xs" truncate>
                            {entry.artist}
                        </Text>
                    </button>
                ))}
            </div>
        </section>
    );
};
