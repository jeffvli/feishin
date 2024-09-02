import type { ReactNode } from 'react';
import type { IHeaderParams } from '@ag-grid-community/core';
import { AiOutlineNumber } from 'react-icons/ai';
import { FiClock } from 'react-icons/fi';
import { RiHeartLine, RiMoreFill, RiStarLine } from 'react-icons/ri';
import styled from 'styled-components';
import { _Text } from '/@/renderer/components/text';

type Presets = 'duration' | 'rowIndex' | 'userFavorite' | 'userRating' | 'actions';

type Options = {
    children?: ReactNode;
    position?: 'left' | 'center' | 'right';
    preset?: Presets;
};

export const HeaderWrapper = styled.div<{ $position: Options['position'] }>`
    display: flex;
    justify-content: ${(props) =>
        props.$position === 'right'
            ? 'flex-end'
            : props.$position === 'center'
              ? 'center'
              : 'flex-start'};
    width: 100%;
    font-family: var(--content-font-family);
    text-transform: uppercase;
`;

const HeaderText = styled(_Text)<{ $position: Options['position'] }>`
    width: 100%;
    height: 100%;
    font-weight: 500;
    line-height: inherit;
    color: var(--ag-header-foreground-color);
    text-align: ${(props) =>
        props.$position === 'right'
            ? 'flex-end'
            : props.$position === 'center'
              ? 'center'
              : 'flex-start'};
    text-transform: uppercase;
`;

const headerPresets = {
    actions: (
        <RiMoreFill
            color="var(--ag-header-foreground-color)"
            size="1em"
        />
    ),
    duration: (
        <FiClock
            color="var(--ag-header-foreground-color)"
            size="1em"
        />
    ),
    rowIndex: (
        <AiOutlineNumber
            color="var(--ag-header-foreground-color)"
            size="1em"
        />
    ),
    userFavorite: (
        <RiHeartLine
            color="var(--ag-header-foreground-color)"
            size="1em"
        />
    ),
    userRating: (
        <RiStarLine
            color="var(--ag-header-foreground-color)"
            size="1em"
        />
    ),
};

export const GenericTableHeader = (
    { displayName }: IHeaderParams,
    { preset, children, position }: Options,
) => {
    if (preset) {
        return <HeaderWrapper $position={position}>{headerPresets[preset]}</HeaderWrapper>;
    }

    return (
        <HeaderWrapper $position={position}>
            <HeaderText
                $position={position}
                overflow="hidden"
                weight={500}
            >
                {children || displayName}
            </HeaderText>
        </HeaderWrapper>
    );
};

GenericTableHeader.defaultProps = {
    position: 'left',
    preset: undefined,
};
