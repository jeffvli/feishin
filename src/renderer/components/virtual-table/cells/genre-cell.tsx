import React from 'react';
import type { ICellRendererParams } from '@ag-grid-community/core';
import { generatePath, Link } from 'react-router-dom';
import type { AlbumArtist, Artist } from '/@/renderer/api/types';
import { Text } from '/@/renderer/components/text';
import { CellContainer } from '/@/renderer/components/virtual-table/cells/generic-cell';
import { AppRoute } from '/@/renderer/router/routes';
import { Separator } from '/@/renderer/components/separator';

export const GenreCell = ({ value, data }: ICellRendererParams) => {
    return (
        <CellContainer $position="left">
            <Text
                $secondary
                overflow="hidden"
                size="md"
            >
                {value?.map((item: Artist | AlbumArtist, index: number) => (
                    <React.Fragment key={`row-${item.id}-${data.uniqueId}`}>
                        {index > 0 && <Separator />}
                        <Text
                            $link
                            $secondary
                            component={Link}
                            overflow="hidden"
                            size="md"
                            to={generatePath(AppRoute.LIBRARY_GENRES_SONGS, {
                                genreId: item.id,
                            })}
                        >
                            {item.name || '—'}
                        </Text>
                    </React.Fragment>
                ))}
            </Text>
        </CellContainer>
    );
};
