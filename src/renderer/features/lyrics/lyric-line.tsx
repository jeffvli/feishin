import { ComponentPropsWithoutRef } from 'react';
import { TextTitle } from '/@/renderer/components/text-title';
import styled from 'styled-components';

interface LyricLineProps extends ComponentPropsWithoutRef<'div'> {
    text: string;
}

const StyledText = styled(TextTitle)`
    color: var(--main-fg);
    font-weight: 400;
    font-size: 2.5vmax;
    transform: scale(0.95);
    opacity: 0.5;

    &.active {
        font-weight: 800;
        transform: scale(1);
        opacity: 1;
    }

    &.active.unsynchronized {
        opacity: 0.8;
    }

    transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
`;

export const LyricLine = ({ text, ...props }: LyricLineProps) => {
    return <StyledText {...props}>{text}</StyledText>;
};
