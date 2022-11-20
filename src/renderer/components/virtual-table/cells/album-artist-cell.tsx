import React from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { generatePath } from 'react-router';
import { Link } from 'react-router-dom';
import { AlbumArtist, Artist } from '@/renderer/api/types';
import { Text } from '@/renderer/components/text';
import { CellContainer } from '@/renderer/components/virtual-table/cells/generic-cell';
import { AppRoute } from '@/renderer/router/routes';

export const AlbumArtistCell = ({ value, data }: ICellRendererParams) => {
  return (
    <CellContainer position="left">
      <Text $secondary overflow="hidden" size="xs">
        {value?.map((item: Artist | AlbumArtist, index: number) => (
          <React.Fragment key={`row-${item.id}-${data.uniqueId}`}>
            {index > 0 && (
              <Text
                $link
                $secondary
                size="xs"
                style={{ display: 'inline-block' }}
              >
                ,
              </Text>
            )}{' '}
            <Text
              $link
              $secondary
              component={Link}
              overflow="hidden"
              size="xs"
              to={generatePath(AppRoute.LIBRARY_ALBUMARTISTS_DETAIL, {
                albumArtistId: item.id,
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
