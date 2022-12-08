import type { ICellRendererParams } from 'ag-grid-community';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Text } from '/@/components/text';

export const CellContainer = styled.div<{
  position?: 'left' | 'center' | 'right';
}>`
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

  return (
    <CellContainer position={position || 'left'}>
      {isLink ? (
        <Text
          $link={isLink}
          $secondary={!primary}
          component={Link}
          overflow="hidden"
          size="xs"
          to={displayedValue.link}
        >
          {isLink ? displayedValue.value : displayedValue}
        </Text>
      ) : (
        <Text
          $secondary={!primary}
          overflow="hidden"
          size="xs"
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
