import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { useEffect, useRef, useTransition } from 'react';

import styles from './expanded-album-list-item.module.css';

import { ItemListItem } from '/@/renderer/components/item-list/helpers/item-list-state';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { useFastAverageColor } from '/@/renderer/hooks';
import { Spinner } from '/@/shared/components/spinner/spinner';

interface ExpandedAlbumListItemProps {
    item: ItemListItem;
    previousItem?: ItemListItem | null;
}

export const ExpandedAlbumListItem = ({ item, previousItem }: ExpandedAlbumListItemProps) => {
    const [, startTransition] = useTransition();
    const previousDataRef = useRef<any>(null);

    const { data, isLoading } = useQuery(
        albumQueries.detail({
            options: {},
            query: { id: item.id },
            serverId: item.serverId,
        }),
    );

    // Store the previous data when we have new data
    useEffect(() => {
        if (data && !isLoading) {
            previousDataRef.current = data;
        }
    }, [data, isLoading]);

    // Use current data if available, otherwise use previous data for smooth transition
    const displayData = data || previousDataRef.current;
    const isDataTransitioning = isLoading && previousDataRef.current;

    const color = useFastAverageColor({
        id: item.id,
        src: displayData?.imageUrl,
        srcLoaded: !isDataTransitioning,
    });

    // Start transition when item changes
    useEffect(() => {
        if (previousItem && previousItem.id !== item.id) {
            startTransition(() => {});
        }
    }, [item.id, previousItem, startTransition]);

    return (
        <motion.div
            animate={{
                backgroundColor: color.background,
                opacity: isDataTransitioning ? 0.8 : 1,
            }}
            className={styles.container}
            exit={{ opacity: 0 }}
            initial={{ backgroundColor: color.background, opacity: 0 }}
            transition={{
                duration: 0.4,
                ease: 'easeInOut',
            }}
        >
            {isDataTransitioning && (
                <div className={styles.loading}>
                    <Spinner />
                </div>
            )}
            <div style={{ padding: '1rem' }}>
                ExpandedAlbumListItem - {displayData?.name || 'Loading...'}
            </div>
        </motion.div>
    );
};
