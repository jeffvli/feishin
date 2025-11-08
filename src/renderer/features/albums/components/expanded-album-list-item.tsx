import { useSuspenseQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import formatDuration from 'format-duration';
import { motion } from 'motion/react';
import { Fragment, Suspense } from 'react';

import styles from './expanded-album-list-item.module.css';

import { ItemListItem } from '/@/renderer/components/item-list/helpers/item-list-state';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { useFastAverageColor } from '/@/renderer/hooks';
import { Group } from '/@/shared/components/group/group';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';
import { Separator } from '/@/shared/components/separator/separator';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Table } from '/@/shared/components/table/table';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import { Text } from '/@/shared/components/text/text';

interface ExpandedAlbumListItemProps {
    item: ItemListItem;
}

export const ExpandedAlbumListItem = ({ item }: ExpandedAlbumListItemProps) => {
    const { data, isLoading } = useSuspenseQuery(
        albumQueries.detail({
            query: { id: item.id },
            serverId: item._serverId,
        }),
    );

    const color = useFastAverageColor({
        algorithm: 'sqrt',
        id: item.id,
        src: data?.imageUrl,
        srcLoaded: true,
    });

    if (color.isLoading) {
        return null;
    }

    return (
        <motion.div
            animate={{
                opacity: 1,
            }}
            className={styles.container}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            style={{ backgroundColor: color.background }}
        >
            {isLoading && (
                <div className={styles.loading}>
                    <Spinner />
                </div>
            )}
            <Suspense>
                <div className={styles.expanded}>
                    <div className={styles.content}>
                        <div className={styles.header}>
                            <TextTitle
                                className={clsx(styles.itemTitle, { [styles.dark]: color.isDark })}
                                fw={700}
                                order={4}
                            >
                                {data?.name}
                            </TextTitle>
                            <Group
                                className={clsx(styles.itemSubtitle, {
                                    [styles.dark]: color.isDark,
                                })}
                                gap="xs"
                            >
                                {data?.albumArtists.map((artist, index) => (
                                    <Fragment key={artist.id}>
                                        <Text
                                            className={clsx(styles.itemSubtitle, {
                                                [styles.dark]: color.isDark,
                                            })}
                                        >
                                            {artist.name}
                                        </Text>
                                        {index < data?.albumArtists.length - 1 && <Separator />}
                                    </Fragment>
                                ))}
                            </Group>
                        </div>
                        <div className={clsx(styles.tracks, { [styles.dark]: color.isDark })}>
                            <ScrollArea>
                                <Table withRowBorders={false}>
                                    <Table.Tbody>
                                        {data?.songs?.map((song) => (
                                            <Table.Tr key={song.id}>
                                                <Table.Td style={{ width: '45px' }}>
                                                    {song.discNumber} - {song.trackNumber}
                                                </Table.Td>
                                                <Table.Td>{song.name}</Table.Td>
                                                <Table.Td style={{ width: '50px' }}>
                                                    {formatDuration(song.duration)}
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </ScrollArea>
                        </div>
                    </div>
                    <div className={styles.imageContainer}>
                        <div
                            className={styles.backgroundImage}
                            style={{
                                ['--bg-color' as string]: color?.background,
                                backgroundImage: `url(${data?.imageUrl})`,
                            }}
                        />
                    </div>
                </div>
            </Suspense>
        </motion.div>
    );
};
