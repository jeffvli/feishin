import React from 'react';
import { Center, Skeleton } from '@mantine/core';
import { RiAlbumFill } from 'react-icons/ri';
import { generatePath, useNavigate } from 'react-router';
import { Link } from 'react-router-dom';
import { SimpleImg } from 'react-simple-img';
import type { ListChildComponentProps } from 'react-window';
import styled from 'styled-components';
import { Text } from '/@/components/text';
import type { PlayQueueAddOptions, LibraryItem, CardRow, CardRoute, Play } from '/@/types';
import GridCardControls from './grid-card-controls';

const CardWrapper = styled.div<{
  itemGap: number;
  itemHeight: number;
  itemWidth: number;
  link?: boolean;
}>`
  flex: ${({ itemWidth }) => `0 0 ${itemWidth - 12}px`};
  width: ${({ itemWidth }) => `${itemWidth}px`};
  height: ${({ itemHeight, itemGap }) => `${itemHeight - 12 - itemGap}px`};
  margin: ${({ itemGap }) => `0 ${itemGap / 2}px`};
  padding: 12px 12px 0;
  background: var(--card-default-bg);
  border-radius: var(--card-default-radius);
  cursor: ${({ link }) => link && 'pointer'};
  transition: border 0.2s ease-in-out, background 0.2s ease-in-out;
  user-select: none;
  pointer-events: auto; // https://github.com/bvaughn/react-window/issues/128#issuecomment-460166682

  &:hover {
    background: var(--card-default-bg-hover);
  }

  &:hover div {
    opacity: 1;
  }

  &:hover * {
    &::before {
      opacity: 0.5;
    }
  }

  &:focus-visible {
    outline: 1px solid #fff;
  }
`;

const StyledCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  height: 100%;
  padding: 0;
  border-radius: var(--card-default-radius);
`;

const ImageSection = styled.div<{ size?: number }>`
  position: relative;
  width: ${({ size }) => size && `${size - 24}px`};
  height: ${({ size }) => size && `${size - 24}px`};
  border-radius: var(--card-default-radius);

  &::before {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    background: linear-gradient(0deg, rgba(0, 0, 0, 100%) 35%, rgba(0, 0, 0, 0%) 100%);
    opacity: 0;
    transition: all 0.2s ease-in-out;
    content: '';
    user-select: none;
  }
`;

const Image = styled(SimpleImg)`
  border-radius: var(--card-default-radius);
`;

const ControlsContainer = styled.div`
  position: absolute;
  bottom: 0;
  z-index: 50;
  width: 100%;
  opacity: 0;
  transition: all 0.2s ease-in-out;
`;

const DetailSection = styled.div`
  display: flex;
  flex-direction: column;
`;

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

interface BaseGridCardProps {
  columnIndex: number;
  controls: {
    cardControls: any[];
    cardRows: CardRow[];
    handlePlayQueueAdd: (options: PlayQueueAddOptions) => void;
    itemType: LibraryItem;
    playButtonBehavior: Play;
    route: CardRoute;
  };
  data: any;
  listChildProps: Omit<ListChildComponentProps, 'data' | 'style'>;
  sizes: {
    itemGap: number;
    itemHeight: number;
    itemWidth: number;
  };
}

export const DefaultCard = ({
  listChildProps,
  data,
  columnIndex,
  controls,
  sizes,
}: BaseGridCardProps) => {
  const navigate = useNavigate();
  const { index, isScrolling } = listChildProps;
  const { itemGap, itemHeight, itemWidth } = sizes;
  const { itemType, cardRows, route } = controls;

  const cardSize = itemWidth - 24;

  if (data) {
    return (
      <CardWrapper
        key={`card-${columnIndex}-${index}`}
        link
        itemGap={itemGap}
        itemHeight={itemHeight}
        itemWidth={itemWidth}
        onClick={() =>
          navigate(
            generatePath(
              route.route,
              route.slugs?.reduce((acc, slug) => {
                return {
                  ...acc,
                  [slug.slugProperty]: data[slug.idProperty],
                };
              }, {}),
            ),
          )
        }
      >
        <StyledCard>
          <ImageSection size={itemWidth}>
            {data?.imageUrl ? (
              <Image
                animationDuration={0.3}
                height={cardSize}
                imgStyle={{ objectFit: 'cover' }}
                placeholder="var(--card-default-bg)"
                src={data?.imageUrl}
                width={cardSize}
              />
            ) : (
              <Center
                sx={{
                  background: 'var(--placeholder-bg)',
                  borderRadius: 'var(--card-default-radius)',
                  height: '100%',
                  width: '100%',
                }}
              >
                <RiAlbumFill
                  color="var(--placeholder-fg)"
                  size={35}
                />
              </Center>
            )}
            <ControlsContainer>
              {!isScrolling && (
                <GridCardControls
                  itemData={data}
                  itemType={itemType}
                />
              )}
            </ControlsContainer>
          </ImageSection>
          <DetailSection>
            {cardRows.map((row: CardRow, index: number) => {
              if (row.arrayProperty && row.route) {
                return (
                  <Row
                    key={`row-${row.property}-${columnIndex}`}
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
                          size={index > 0 ? 'xs' : 'md'}
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
                  <Row key={`row-${row.property}-${columnIndex}`}>
                    {data[row.property].map((item: any) => (
                      <Text
                        key={`${data.id}-${item.id}`}
                        $noSelect
                        $secondary={index > 0}
                        overflow="hidden"
                        size={index > 0 ? 'xs' : 'md'}
                      >
                        {row.arrayProperty && item[row.arrayProperty]}
                      </Text>
                    ))}
                  </Row>
                );
              }

              return (
                <Row key={`row-${row.property}-${columnIndex}`}>
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
                      size={index > 0 ? 'xs' : 'md'}
                    >
                      {data && data[row.property]}
                    </Text>
                  )}
                </Row>
              );
            })}
          </DetailSection>
        </StyledCard>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper
      key={`card-${columnIndex}-${index}`}
      itemGap={itemGap}
      itemHeight={itemHeight}
      itemWidth={itemWidth + 12}
    >
      <StyledCard>
        <Skeleton
          visible
          radius="sm"
        >
          <ImageSection size={itemWidth} />
        </Skeleton>
        <DetailSection>
          {cardRows.map((row: CardRow, index: number) => (
            <Skeleton
              key={`row-${row.property}-${columnIndex}`}
              height={20}
              my={2}
              radius="md"
              visible={!data}
              width={!data ? (index > 0 ? '50%' : '90%') : '100%'}
            >
              <Row />
            </Skeleton>
          ))}
        </DetailSection>
      </StyledCard>
    </CardWrapper>
  );
};
