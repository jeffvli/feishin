import { ComponentPropsWithoutRef } from 'react';
import { TextTitle } from '/@/renderer/components/text-title';
import { TitleProps } from '@mantine/core';
import styled from 'styled-components';

interface LyricLineProps extends ComponentPropsWithoutRef<'div'> {
    alignment: 'left' | 'center' | 'right';
    fontSize: number;
    text: string;
}

interface StyledTextProps extends TitleProps {
    $alignment: string;
    $animationDuration: string;
    $fontSize: number;
}

const StyledText = styled(TextTitle)<StyledTextProps>`
    padding: 0 1rem;
    font-size: ${(props) => props.$fontSize}px;
    font-weight: 600;
    color: var(--main-fg);
    text-align: ${(props) => props.$alignment};
    opacity: 0.5;

    &.active {
        text-shadow: 0 0 5px var(--main-fg);
        opacity: 1;
        animation: fadeIn 500ms ease-in-out forwards;

        @keyframes fadeIn {
            from {
                opacity: 0.5;
            }

            to {
                opacity: 1;
            }
        }
    }

    &.unsynchronized {
        opacity: 1;
    }
`;

export const LyricLine = ({
    text,
    alignment,
    fontSize,
    animationDuration,
    ...props
}: LyricLineProps & { animationDuration: string }) => {
    return (
        <StyledText
            $alignment={alignment}
            $animationDuration={animationDuration}
            $fontSize={fontSize}
            {...props}
        >
            {text}
        </StyledText>
    );
};
