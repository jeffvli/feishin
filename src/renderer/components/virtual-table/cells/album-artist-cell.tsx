import type { AlbumArtist, Artist } from '/@/shared/types/domain-types';
import type { ICellRendererParams } from '@ag-grid-community/core';

import React from 'react';
import { generatePath } from 'react-router';
import { Link } from 'react-router-dom';

import { CellContainer } from '/@/renderer/components/virtual-table/cells/generic-cell';
import { AppRoute } from '/@/renderer/router/routes';
import { Separator } from '/@/shared/components/separator/separator';
import { Skeleton } from '/@/shared/components/skeleton/skeleton';
import { Text } from '/@/shared/components/text/text';

export const AlbumArtistCell = ({ data, value }: ICellRendererParams) => {
    if (value === undefined) {
        return (
            <CellContainer position="left">
                <Skeleton
                    height="1rem"
                    width="80%"
                />
            </CellContainer>
        );
    }

    return (
        <CellContainer position="left">
            <Text
                isMuted
                overflow="hidden"
                size="md"
            >
                {value?.map((item: AlbumArtist | Artist, index: number) => (
                    <React.Fragment key={`row-${item.id}-${data.uniqueId}`}>
                        {index > 0 && <Separator />}
                        {item.id ? (
                            <Text
                                component={Link}
                                isLink
                                isMuted
                                overflow="hidden"
                                size="md"
                                to={generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                                    albumArtistId: item.id,
                                })}
                            >
                                {item.name || '—'}
                            </Text>
                        ) : (
                            <Text
                                isMuted
                                overflow="hidden"
                                size="md"
                            >
                                {item.name || '—'}
                            </Text>
                        )}
                    </React.Fragment>
                ))}
            </Text>
        </CellContainer>
    );
};
