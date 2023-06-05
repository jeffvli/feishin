import { RiCloseFill } from 'react-icons/ri';
import styled from 'styled-components';
import { Button } from '/@/renderer/components';

const LyricClearButton = styled(Button)`
  position: absolute;
  right: 10px;
  z-index: 999;
  top: 7vh;

  @media (max-width: 768px) {
    top: 5vh;
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
      tooltip={{ label: 'Remove incorrect lyrics', position: 'bottom' }}
      variant="default"
      onClick={onClick}
    >
      Clear
    </LyricClearButton>
  );
};
