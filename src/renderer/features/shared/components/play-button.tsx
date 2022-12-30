import { motion } from 'framer-motion';
import { RiPlayFill } from 'react-icons/ri';
import styled from 'styled-components';
import { ButtonProps, _Button } from '/@/renderer/components';

const MotionButton = styled(motion(_Button))`
  width: 50px;
  height: 50px;
  border-radius: 50%;
`;

export const PlayButton = ({ ...props }: Omit<ButtonProps, 'children'>) => {
  return (
    <MotionButton
      variant="filled"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      <RiPlayFill size={15} />
    </MotionButton>
  );
};
