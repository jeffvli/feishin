import type { ReactNode } from 'react';
import type { IHeaderParams } from '@ag-grid-community/core';
import { AiOutlineNumber } from 'react-icons/ai';
import { FiClock } from 'react-icons/fi';
import { RiHeartLine, RiStarLine } from 'react-icons/ri';
import styled from 'styled-components';
import { _Text } from '/@/renderer/components/text';

type Presets = 'duration' | 'rowIndex' | 'userFavorite' | 'userRating';

type Options = {
  children?: ReactNode;
  position?: 'left' | 'center' | 'right';
  preset?: Presets;
};

const HeaderWrapper = styled.div<{ position: Options['position'] }>`
  display: flex;
  justify-content: ${(props) =>
    props.position === 'right'
      ? 'flex-end'
      : props.position === 'center'
      ? 'center'
      : 'flex-start'};
  width: 100%;
  font-family: var(--content-font-family);
  text-transform: uppercase;
`;

const TextHeaderWrapper = styled(_Text)<{ position: Options['position'] }>`
  width: 100%;
  color: var(--ag-header-foreground-color);
  font-weight: 500;
  text-align: ${(props) =>
    props.position === 'right'
      ? 'flex-end'
      : props.position === 'center'
      ? 'center'
      : 'flex-start'};
  text-transform: uppercase;
`;

const headerPresets = {
  duration: <FiClock size={15} />,
  rowIndex: <AiOutlineNumber size={15} />,
  userFavorite: <RiHeartLine size={15} />,
  userRating: <RiStarLine size={15} />,
};

export const GenericTableHeader = (
  { displayName }: IHeaderParams,
  { preset, children, position }: Options,
) => {
  if (preset) {
    return <HeaderWrapper position={position}>{headerPresets[preset]}</HeaderWrapper>;
  }

  return (
    <TextHeaderWrapper
      fw="500"
      overflow="hidden"
      position={position}
    >
      {children || displayName}
    </TextHeaderWrapper>
  );
};

GenericTableHeader.defaultProps = {
  position: 'left',
  preset: undefined,
};
