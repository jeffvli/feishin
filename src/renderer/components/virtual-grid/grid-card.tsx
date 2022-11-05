import styled from '@emotion/styled';
import { Center, Skeleton } from '@mantine/core';
import { RiAlbumFill } from 'react-icons/ri';
import { Link, generatePath } from 'react-router-dom';
import { Text } from '@/renderer/components/text';
import { GridCardControls } from '@/renderer/components/virtual-grid/grid-card-controls';
import { AppRoute } from '@/renderer/router/routes';
import { fadeIn } from '@/renderer/styles';
import { CardRow } from '@/renderer/types';

const CardWrapper = styled.div<{
  itemGap: number;
  itemHeight: number;
  itemWidth: number;
}>`
  flex: ${({ itemWidth }) => `0 0 ${itemWidth}px`};
  width: ${({ itemWidth }) => `${itemWidth}px`};
  height: ${({ itemHeight }) => `${itemHeight}px`};
  margin: ${({ itemGap }) => `0 ${itemGap / 2}px`};
  transition: border 0.2s ease-in-out;
  user-select: none;
  pointer-events: auto; // https://github.com/bvaughn/react-window/issues/128#issuecomment-460166682

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
  border-radius: 3px;
`;

const ImageSection = styled.div`
  position: relative;
  width: 100%;
`;

interface ImageProps {
  height: number;
  src: string;
}

const Image = styled.div<ImageProps>`
  ${fadeIn};
  height: ${({ height }) => `${height}px`};
  background-image: ${({ src }) => `url(${src})`};
  background-position: center;
  background-size: cover;
  border: 0;
  border-radius: 5px;

  &::before {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      0deg,
      rgba(0, 0, 0, 100%) 35%,
      rgba(0, 0, 0, 0%) 100%
    );
    opacity: 0;
    transition: all 0.2s ease-in-out;
    content: '';
    user-select: none;
  }
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

const Row = styled.div`
  height: 25px;
  padding: 0 0.2rem;
`;

export const GridCard = ({ data, index, style }: any) => {
  const {
    itemHeight,
    itemWidth,
    columnCount,
    itemGap,
    itemCount,
    cardControls,
    handlePlayQueueAdd,
    cardRows,
    itemData,
    itemType,
  } = data;

  const startIndex = index * columnCount;
  const stopIndex = Math.min(itemCount - 1, startIndex + columnCount - 1);
  const cards = [];

  for (let i = startIndex; i <= stopIndex; i += 1) {
    if (itemData[i]) {
      cards.push(
        <CardWrapper
          key={`card-${i}-${index}`}
          itemGap={itemGap}
          itemHeight={itemHeight}
          itemWidth={itemWidth}
        >
          <StyledCard>
            <Link
              tabIndex={0}
              to={generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
                albumId: itemData[i]?.id,
              })}
            >
              <ImageSection style={{ height: `${itemWidth}px` }}>
                {itemData[i]?.imageUrl ? (
                  <Image height={itemWidth} src={itemData[i]?.imageUrl} />
                ) : (
                  <Center
                    sx={{
                      background: 'var(--placeholder-bg)',
                      borderRadius: '5px',
                      height: '100%',
                    }}
                  >
                    <RiAlbumFill color="var(--placeholder-fg)" size={35} />
                  </Center>
                )}

                <ControlsContainer>
                  <GridCardControls
                    cardControls={cardControls}
                    handlePlayQueueAdd={handlePlayQueueAdd}
                    itemData={itemData[i]}
                    itemType={itemType}
                  />
                </ControlsContainer>
              </ImageSection>
            </Link>
            <DetailSection>
              {cardRows.map((row: CardRow) => (
                <Row key={row.prop}>
                  <Text overflow="hidden">
                    {itemData[i] && itemData[i][row.prop]}
                  </Text>
                </Row>
              ))}
            </DetailSection>
          </StyledCard>
        </CardWrapper>
      );
    } else {
      cards.push(
        <CardWrapper
          key={`card-${i}-${index}`}
          itemGap={itemGap}
          itemHeight={itemHeight}
          itemWidth={itemWidth}
        >
          <StyledCard>
            <Skeleton visible radius="sm">
              <ImageSection style={{ height: `${itemWidth}px` }} />
            </Skeleton>
            <DetailSection>
              {cardRows.map((row: CardRow, index: number) => (
                <Skeleton
                  key={`row-${row.prop}`}
                  my={2}
                  radius="md"
                  visible={!itemData[i]}
                  width={!itemData[i] ? (index > 0 ? '50%' : '90%') : '100%'}
                >
                  <Row />
                </Skeleton>
              ))}
            </DetailSection>
          </StyledCard>
        </CardWrapper>
      );
    }
  }

  return (
    <div
      style={{
        ...style,
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'start',
      }}
    >
      {cards}
    </div>
  );
};
