import { ComponentPropsWithoutRef } from 'react';
import { TextTitle } from '/@/renderer/components/text-title';
import { TitleProps } from '@mantine/core';
import styled from 'styled-components';

interface LyricLineProps extends ComponentPropsWithoutRef<'div'> {
    alignment: 'left' | 'center' | 'right';
    fontSize: number;
    text: string;
}

const StyledText = styled(TextTitle)<TitleProps & { $alignment: string; $fontSize: number }>`
    color: var(--main-fg);
    font-weight: 400;
    text-align: ${(props) => props.$alignment};
    font-size: ${(props) => props.$fontSize}px;
    opacity: 0.5;
    padding: 0 1rem;

    &.active {
        font-weight: 800;
        opacity: 1;
    }

    &.unsynchronized {
        opacity: 1;
    }

    transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
`;

export const LyricLine = ({ text, alignment, fontSize, ...props }: LyricLineProps) => {
    return (
        <StyledText
            $alignment={alignment}
            $fontSize={fontSize}
            {...props}
        >
            {text}
        </StyledText>
    );
};
