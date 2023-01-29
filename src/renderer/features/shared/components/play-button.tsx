import { motion } from 'framer-motion';
import { RiPlayFill } from 'react-icons/ri';
import styled from 'styled-components';
import { ButtonProps, _Button } from '/@/renderer/components';

const MotionButton = styled(motion(_Button))`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--primary-color);
  border: none;
  border-radius: 50%;
  opacity: 0.8;
  transition: background-color 0.2s linear;
`;

export const PlayButton = ({ ...props }: Omit<ButtonProps, 'children'>) => {
  return (
    <MotionButton
      h="50px"
      variant="filled"
      w="50px"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      <RiPlayFill size={20} />
    </MotionButton>
  );
};
