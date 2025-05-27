import type { ICellRendererParams } from '@ag-grid-community/core';

import React, { useMemo } from 'react';
import { generatePath } from 'react-router';
import { Link } from 'react-router-dom';

import styles from './combined-title-cell.module.css';

import { ListCoverControls } from '/@/renderer/components/virtual-table/cells/combined-title-cell-controls';
import { AppRoute } from '/@/renderer/router/routes';
import { SEPARATOR_STRING } from '/@/shared/api/utils';
import { Image } from '/@/shared/components/image/image';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';
import { Text } from '/@/shared/components/text/text';
import { AlbumArtist, Artist } from '/@/shared/types/domain-types';

export const CombinedTitleCell = ({
    context,
    data,
    node,
    rowIndex,
    value,
}: ICellRendererParams) => {
    const artists = useMemo(() => {
        if (!value) return null;
        return value.artists?.length ? value.artists : value.albumArtists;
    }, [value]);

    if (value === undefined) {
        return (
            <div
                className={styles.cellContainer}
                style={{ gridTemplateColumns: `${node.rowHeight || 40}px minmax(0, 1fr)` }}
            >
                <div
                    className={styles.imageWrapper}
                    style={{
                        height: `${(node.rowHeight || 40) - 10}px`,
                        width: `${(node.rowHeight || 40) - 10}px`,
                    }}
                >
                    <Skeleton className={styles.image} />
                </div>
                <Skeleton
                    className={styles.skeletonMetadata}
                    height="1rem"
                    width="80%"
                />
            </div>
        );
    }

    return (
        <div
            className={styles.cellContainer}
            style={{ gridTemplateColumns: `${node.rowHeight || 40}px minmax(0, 1fr)` }}
        >
            <div
                className={styles.imageWrapper}
                style={{
                    height: `${(node.rowHeight || 40) - 10}px`,
                    width: `${(node.rowHeight || 40) - 10}px`,
                }}
            >
                <Image
                    alt="cover"
                    className={styles.image}
                    src={value.imageUrl}
                />

                <ListCoverControls
                    className={styles.playButton}
                    context={context}
                    itemData={value}
                    itemType={context.itemType}
                    uniqueId={data?.uniqueId}
                />
            </div>
            <div className={styles.metadataWrapper}>
                <Text
                    className="current-song-child"
                    overflow="hidden"
                    size="md"
                >
                    {value.name}
                </Text>
                <Text
                    isMuted
                    overflow="hidden"
                    size="md"
                >
                    {artists?.length ? (
                        artists.map((artist: AlbumArtist | Artist, index: number) => (
                            <React.Fragment key={`queue-${rowIndex}-artist-${artist.id}`}>
                                {index > 0 ? SEPARATOR_STRING : null}
                                {artist.id ? (
                                    <Text
                                        component={Link}
                                        isLink
                                        isMuted
                                        overflow="hidden"
                                        size="md"
                                        style={{ width: 'fit-content' }}
                                        to={generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                                            albumArtistId: artist.id,
                                        })}
                                    >
                                        {artist.name}
                                    </Text>
                                ) : (
                                    <Text
                                        isMuted
                                        overflow="hidden"
                                        size="md"
                                        style={{ width: 'fit-content' }}
                                    >
                                        {artist.name}
                                    </Text>
                                )}
                            </React.Fragment>
                        ))
                    ) : (
                        <Text isMuted>—</Text>
                    )}
                </Text>
            </div>
        </div>
    );
};
