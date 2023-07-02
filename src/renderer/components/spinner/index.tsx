import { Center } from '@mantine/core';
import type { IconType } from 'react-icons';
import { RiLoader5Fill } from 'react-icons/ri';
import styled from 'styled-components';
import { rotating } from '/@/renderer/styles';

interface SpinnerProps extends IconType {
    color?: string;
    container?: boolean;
    size?: number;
}

export const SpinnerIcon = styled(RiLoader5Fill)`
    ${rotating}
    animation: rotating 1s ease-in-out infinite;
`;

export const Spinner = ({ ...props }: SpinnerProps) => {
    if (props.container) {
        return (
            <Center
                h="100%"
                w="100%"
            >
                <SpinnerIcon
                    color={props.color}
                    size={props.size}
                />
            </Center>
        );
    }

    return <SpinnerIcon {...props} />;
};

Spinner.defaultProps = {
    color: undefined,
    size: 15,
};
