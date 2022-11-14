import { IconType } from 'react-icons';
import { RiLoader5Fill } from 'react-icons/ri';
import styled from 'styled-components';
import { rotating } from '@/renderer/styles';

interface SpinnerProps extends IconType {
  color?: string;
  size?: number;
}

export const SpinnerIcon = styled(RiLoader5Fill)`
  ${rotating}
  animation: rotating 1s ease-in-out infinite;
`;

export const Spinner = ({ ...props }: SpinnerProps) => {
  return <SpinnerIcon {...props} />;
};

Spinner.defaultProps = {
  color: undefined,
  size: 15,
};
