import { forwardRef, HTMLAttributes, CSSProperties } from 'react';
import { Divider as MantineDivider } from '@mantine/core';
import styled from 'styled-components';

interface DividerProps extends HTMLAttributes<HTMLDivElement> {
    color?: string;
    label?: string;
    labelPosition?: 'left' | 'center' | 'right';
    marginX?: CSSProperties['margin'];
    marginY?: CSSProperties['margin'];
    orientation?: 'horizontal' | 'vertical';
}

export const Divider = forwardRef<HTMLDivElement, DividerProps>(
    (
        { color, label, labelPosition, marginX, marginY, orientation, ...props }: DividerProps,
        ref,
    ) => {
        return (
            <StyledDivider
                ref={ref}
                $color={color}
                $marginX={marginX}
                $marginY={marginY}
                label={label}
                labelPosition={labelPosition}
                orientation={orientation}
                {...props}
            />
        );
    },
);

const StyledDivider = styled(MantineDivider)<{
    $color?: DividerProps['color'];
    $marginX?: DividerProps['marginX'];
    $marginY?: DividerProps['marginY'];
}>`
    margin-top: ${(props) => props.$marginY};
    margin-bottom: ${(props) => props.$marginY};
    margin-left: ${(props) => props.$marginX};
    margin-right: ${(props) => props.$marginX};
    border-color: ${(props) => props.$color || 'var(--generic-border-color)'} !important;
`;
