import { UnstyledButton } from '@mantine/core';
import { RiPlayFill } from 'react-icons/ri';
import styled from 'styled-components';

const MotionButton = styled(UnstyledButton)`
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--btn-filled-bg);
    border: none;
    border-radius: 50%;
    opacity: 0.8;

    svg {
        fill: var(--btn-filled-fg);
    }

    &:hover {
        background-color: var(--btn-filled-bg-hover);
        transform: scale(1.1);

        svg {
            fill: var(--btn-filled-fg-hover);
        }
    }

    &:active {
        transform: scale(0.95);
    }

    transition: background-color 0.2s ease-in-out;
    transition: transform 0.2s ease-in-out;
`;

export const PlayButton = ({ ...props }: any) => {
    return (
        <MotionButton
            {...props}
            h="45px"
            w="45px"
        >
            <RiPlayFill size={20} />
        </MotionButton>
    );
};
