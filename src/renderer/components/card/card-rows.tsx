import React from 'react';
import { generatePath } from 'react-router';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Album, AlbumArtist, Artist } from '/@/renderer/api/types';
import { Text } from '/@/renderer/components/text';
import { AppRoute } from '/@/renderer/router/routes';
import { CardRow } from '/@/renderer/types';

const Row = styled.div<{ $secondary?: boolean }>`
  width: 100%;
  max-width: 100%;
  height: 22px;
  padding: 0 0.2rem;
  overflow: hidden;
  color: ${({ $secondary }) => ($secondary ? 'var(--main-fg-secondary)' : 'var(--main-fg)')};
  white-space: nowrap;
  text-overflow: ellipsis;
  user-select: none;
`;

interface CardRowsProps {
  data: any;
  rows: CardRow<Album | Artist | AlbumArtist>[];
}

export const CardRows = ({ data, rows }: CardRowsProps) => {
  return (
    <>
      {rows.map((row, index: number) => {
        if (row.arrayProperty && row.route) {
          return (
            <Row
              key={`row-${row.property}-${index}`}
              $secondary={index > 0}
            >
              {data[row.property].map((item: any, itemIndex: number) => (
                <React.Fragment key={`${data.id}-${item.id}`}>
                  {itemIndex > 0 && (
                    <Text
                      $noSelect
                      sx={{
                        display: 'inline-block',
                        padding: '0 2px 0 1px',
                      }}
                    >
                      ,
                    </Text>
                  )}{' '}
                  <Text
                    $link
                    $noSelect
                    $secondary={index > 0}
                    component={Link}
                    overflow="hidden"
                    size={index > 0 ? 'sm' : 'md'}
                    to={generatePath(
                      row.route!.route,
                      row.route!.slugs?.reduce((acc, slug) => {
                        return {
                          ...acc,
                          [slug.slugProperty]: data[slug.idProperty],
                        };
                      }, {}),
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {row.arrayProperty && item[row.arrayProperty]}
                  </Text>
                </React.Fragment>
              ))}
            </Row>
          );
        }

        if (row.arrayProperty) {
          return (
            <Row key={`row-${row.property}`}>
              {data[row.property].map((item: any) => (
                <Text
                  key={`${data.id}-${item.id}`}
                  $noSelect
                  $secondary={index > 0}
                  overflow="hidden"
                  size={index > 0 ? 'sm' : 'md'}
                >
                  {row.arrayProperty && item[row.arrayProperty]}
                </Text>
              ))}
            </Row>
          );
        }

        return (
          <Row key={`row-${row.property}`}>
            {row.route ? (
              <Text
                $link
                $noSelect
                component={Link}
                overflow="hidden"
                to={generatePath(
                  row.route.route,
                  row.route.slugs?.reduce((acc, slug) => {
                    return {
                      ...acc,
                      [slug.slugProperty]: data[slug.idProperty],
                    };
                  }, {}),
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {data && data[row.property]}
              </Text>
            ) : (
              <Text
                $noSelect
                $secondary={index > 0}
                overflow="hidden"
                size={index > 0 ? 'sm' : 'md'}
              >
                {data && data[row.property]}
              </Text>
            )}
          </Row>
        );
      })}
    </>
  );
};

export const ALBUM_CARD_ROWS: { [key: string]: CardRow<Album> } = {
  albumArtists: {
    arrayProperty: 'name',
    property: 'albumArtists',
    route: {
      route: AppRoute.LIBRARY_ALBUMARTISTS_DETAIL,
      slugs: [{ idProperty: 'id', slugProperty: 'albumArtistId' }],
    },
  },
  artists: {
    arrayProperty: 'name',
    property: 'artists',
    route: {
      route: AppRoute.LIBRARY_ALBUMARTISTS_DETAIL,
      slugs: [{ idProperty: 'id', slugProperty: 'albumArtistId' }],
    },
  },
  createdAt: {
    property: 'createdAt',
  },
  duration: {
    property: 'duration',
  },
  lastPlayedAt: {
    property: 'lastPlayedAt',
  },
  name: {
    property: 'name',
    route: {
      route: AppRoute.LIBRARY_ALBUMS_DETAIL,
      slugs: [{ idProperty: 'id', slugProperty: 'albumId' }],
    },
  },
  playCount: {
    property: 'playCount',
  },
  rating: {
    property: 'rating',
  },
  releaseDate: {
    property: 'releaseDate',
  },
  releaseYear: {
    property: 'releaseYear',
  },
  songCount: {
    property: 'songCount',
  },
};

export const ALBUMARTIST_CARD_ROWS: { [key: string]: CardRow<AlbumArtist> } = {
  albumCount: {
    property: 'albumCount',
  },
  duration: {
    property: 'duration',
  },
  genres: {
    property: 'genres',
  },
  lastPlayedAt: {
    property: 'lastPlayedAt',
  },
  name: {
    property: 'name',
    route: {
      route: AppRoute.LIBRARY_ALBUMARTISTS_DETAIL,
      slugs: [{ idProperty: 'id', slugProperty: 'albumArtistId' }],
    },
  },
  playCount: {
    property: 'playCount',
  },
  rating: {
    property: 'rating',
  },
  songCount: {
    property: 'songCount',
  },
};
