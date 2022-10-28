import styled from '@emotion/styled';
import { Skeleton } from '@mantine/core';
import { GridCardControls } from '@/renderer/components/virtual-grid/grid-card-controls';
import { fadeIn } from '@/renderer/styles';
import { CardRow } from '../../types';
import { Text } from '../text';

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
  background: var(--grid-card-bg);
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
  transition: background-image 0.5s ease-in-out;

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
            <ImageSection style={{ height: `${itemWidth}px` }}>
              <Image height={itemWidth} src={itemData[i]?.imageUrl} />
              <ControlsContainer>
                <GridCardControls
                  cardControls={cardControls}
                  handlePlayQueueAdd={handlePlayQueueAdd}
                  itemData={itemData[i]}
                  itemType={itemType}
                />
              </ControlsContainer>
            </ImageSection>
            <DetailSection>
              {cardRows.map((row: CardRow) => (
                <Row>
                  <Text overflow="hidden" to={row.route?.route} weight={500}>
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
