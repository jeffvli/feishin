import { RiCloseFill } from 'react-icons/ri';
import styled from 'styled-components';
import { Button } from '/@/renderer/components';

const LyricClearButton = styled(Button)`
  position: absolute;
  right: 10px;
  z-index: 999;
  bottom: 6vh;

  @media (max-width: 768px) {
    bottom: 3vh;
  }
`;

interface LyricSkipProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export const LyricSkip = ({ onClick }: LyricSkipProps) => {
  return (
    <LyricClearButton
      leftIcon={<RiCloseFill />}
      size="xl"
      tooltip={{ label: 'Remove incorrect lyrics', position: 'top' }}
      variant="default"
      onClick={onClick}
    >
      Clear
    </LyricClearButton>
  );
};
