import type { IconType } from 'react-icons';
import { RiLoader5Fill } from 'react-icons/ri';
import styled from 'styled-components';
import { rotating } from '/@/renderer/styles';
import { Center } from '/@/renderer/components/center';

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
            <SpinnerContainer>
                <SpinnerIcon
                    color={props.color}
                    size={props.size}
                />
            </SpinnerContainer>
        );
    }

    return <SpinnerIcon {...props} />;
};

const SpinnerContainer = styled(Center)`
    height: 100%;
    width: 100%;
`;

Spinner.defaultProps = {
    color: undefined,
    size: 15,
};
