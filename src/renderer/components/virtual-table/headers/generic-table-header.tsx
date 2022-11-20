import { ReactNode } from 'react';
import { IHeaderParams } from 'ag-grid-community';
import { FiClock } from 'react-icons/fi';
import styled from 'styled-components';

type Presets = 'duration';

type Options = {
  children?: ReactNode;
  position?: 'left' | 'center' | 'right';
  preset?: Presets;
};

const HeaderWrapper = styled.div<{ position: 'left' | 'center' | 'right' }>`
  display: flex;
  justify-content: ${(props) =>
    props.position === 'right'
      ? 'flex-end'
      : props.position === 'center'
      ? 'center'
      : 'flex-start'};
  width: 100%;
  font-family: var(--header-font-family);
  text-transform: uppercase;
`;

const headerPresets = { duration: <FiClock size={15} /> };

export const GenericTableHeader = (
  { displayName }: IHeaderParams,
  { preset, children, position }: Options
) => {
  if (preset) {
    return (
      <HeaderWrapper position={position || 'left'}>
        {headerPresets[preset]}
      </HeaderWrapper>
    );
  }

  return (
    <HeaderWrapper position={position || 'left'}>
      {children || displayName}
    </HeaderWrapper>
  );
};

GenericTableHeader.defaultProps = {
  position: 'left',
  preset: undefined,
};
