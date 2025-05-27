import type { AlbumArtist, Artist } from '/@/shared/types/domain-types';
import type { ICellRendererParams } from '@ag-grid-community/core';

import React from 'react';
import { generatePath, Link } from 'react-router-dom';

import { CellContainer } from '/@/renderer/components/virtual-table/cells/generic-cell';
import { useGenreRoute } from '/@/renderer/hooks/use-genre-route';
import { Separator } from '/@/shared/components/separator/separator';
import { Text } from '/@/shared/components/text/text';

export const GenreCell = ({ data, value }: ICellRendererParams) => {
    const genrePath = useGenreRoute();
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
                        <Text
                            component={Link}
                            isLink
                            isMuted
                            overflow="hidden"
                            size="md"
                            to={generatePath(genrePath, { genreId: item.id })}
                        >
                            {item.name || '—'}
                        </Text>
                    </React.Fragment>
                ))}
            </Text>
        </CellContainer>
    );
};
