import styles from './discover-track-table.module.css';

import { ItemImage } from '/@/renderer/components/item-image/item-image';
import { DiscoverItem } from '/@/renderer/features/discover/utils/lb-adapters';
import {
    usePreviewActions,
    usePreviewPlayingId,
    usePreviewResolvingId,
} from '/@/renderer/features/preview/preview-store';
import { usePlaybackType } from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Stack } from '/@/shared/components/stack/stack';
import { Table } from '/@/shared/components/table/table';
import { TextTitle } from '/@/shared/components/text-title/text-title';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem } from '/@/shared/types/domain-types';
import { PlayerType } from '/@/shared/types/types';

interface DiscoverTrackTableProps {
    items: DiscoverItem[];
    title: React.ReactNode | string;
}

/**
 * A chart-style list of ListenBrainz suggestions, as the dense counterpart to the carousel.
 *
 * `SimpleItemTable` is deliberately not reused. Its columns are a fixed `TableColumn` enum
 * dispatched to built-in cell renderers, so there is no way to ask for a rank that is only a
 * number, and no column exists for a preview toggle at all: the image column hard-wires the
 * library play button. The artist columns are worse, because they read an array of related
 * artists and render router links from a library artist id. A `DiscoverItem` has an artist
 * name and no ids, so those cells would be dead links.
 */
export function DiscoverTrackTable(props: DiscoverTrackTableProps) {
    const { items, title } = props;
    const playbackType = usePlaybackType();
    const playingId = usePreviewPlayingId();
    const resolvingId = usePreviewResolvingId();
    const { toggle } = usePreviewActions();

    // Jukebox plays through the server's own sound card, so a preview on this machine could
    // neither be heard alongside it nor duck it. Offer nothing rather than something broken.
    const canPreview = playbackType !== PlayerType.JUKEBOX;

    if (items.length === 0) {
        return null;
    }

    return (
        <Stack gap="md" w="100%">
            {typeof title === 'string' ? (
                <TextTitle fw={700} isNoSelect order={3}>
                    {title}
                </TextTitle>
            ) : (
                title
            )}
            <Table className={styles.table} highlightOnHover verticalSpacing="xs">
                <Table.Tbody>
                    {items.map((item, index) => {
                        const isPlaying = playingId === item.id;

                        return (
                            <Table.Tr key={item.id}>
                                <Table.Td className={styles.rankCell}>
                                    <Text className={styles.rank} isMuted isNoSelect size="sm">
                                        {index + 1}
                                    </Text>
                                </Table.Td>
                                <Table.Td className={styles.artworkCell}>
                                    <ItemImage
                                        containerClassName={styles.artwork}
                                        fetchPriority="low"
                                        id={null}
                                        itemType={LibraryItem.ALBUM}
                                        src={item.imageUrl}
                                    />
                                </Table.Td>
                                <Table.Td>
                                    <Text className={styles.truncate} isNoSelect size="sm">
                                        {item.title}
                                    </Text>
                                </Table.Td>
                                <Table.Td className={styles.artistCell}>
                                    <Text className={styles.truncate} isMuted isNoSelect size="sm">
                                        {item.artistName}
                                    </Text>
                                </Table.Td>
                                {canPreview && (
                                    <Table.Td className={styles.previewCell}>
                                        <ActionIcon
                                            aria-label={
                                                isPlaying ? 'Pause preview' : 'Play preview'
                                            }
                                            icon={isPlaying ? 'mediaPause' : 'mediaPlay'}
                                            loading={resolvingId === item.id}
                                            onClick={() => {
                                                // The whole item, not a projection of it: the
                                                // preview lookup reads the title and the Apple
                                                // Music links, which a cell-shaped object drops.
                                                void toggle(item.id, {
                                                    artistName: item.artistName,
                                                    title: item.title,
                                                    urlRels: item.urlRels,
                                                });
                                            }}
                                            size="sm"
                                            variant="subtle"
                                        />
                                    </Table.Td>
                                )}
                            </Table.Tr>
                        );
                    })}
                </Table.Tbody>
            </Table>
        </Stack>
    );
}
