import { ReactNode } from 'react';
import { Button as MantineButton } from '@mantine/core';

interface ButtonProps {
  icon?: ReactNode;
}

export const Button = ({ icon }: ButtonProps) => {
  return <MantineButton>Button</MantineButton>;
};
