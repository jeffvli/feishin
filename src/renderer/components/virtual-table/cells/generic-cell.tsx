import type { ICellRendererParams } from '@ag-grid-community/core';
import { motion, Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Skeleton } from '/@/renderer/components/skeleton';
import { Text } from '/@/renderer/components/text';

export const CELL_VARIANTS: Variants = {
  animate: {
    opacity: 1,
  },
  initial: {
    opacity: 0,
  },
};

export const CellContainer = styled(motion.div)<{ position?: 'left' | 'center' | 'right' }>`
  display: flex;
  align-items: center;
  justify-content: ${(props) =>
    props.position === 'right'
      ? 'flex-end'
      : props.position === 'center'
      ? 'center'
      : 'flex-start'};
  width: 100%;
  height: 100%;
`;

type Options = {
  array?: boolean;
  isArray?: boolean;
  isLink?: boolean;
  position?: 'left' | 'center' | 'right';
  primary?: boolean;
};

export const GenericCell = (
  { value, valueFormatted }: ICellRendererParams,
  { position, primary, isLink }: Options,
) => {
  const displayedValue = valueFormatted || value;

  if (value === undefined) {
    return (
      <CellContainer position={position || 'left'}>
        <Skeleton
          height="1rem"
          width="80%"
        />
      </CellContainer>
    );
  }

  return (
    <CellContainer position={position || 'left'}>
      {isLink ? (
        <Text
          $link={isLink}
          $secondary={!primary}
          component={Link}
          overflow="hidden"
          size="sm"
          to={displayedValue.link}
        >
          {isLink ? displayedValue.value : displayedValue}
        </Text>
      ) : (
        <Text
          $secondary={!primary}
          overflow="hidden"
          size="sm"
        >
          {displayedValue}
        </Text>
      )}
    </CellContainer>
  );
};

GenericCell.defaultProps = {
  position: undefined,
};
