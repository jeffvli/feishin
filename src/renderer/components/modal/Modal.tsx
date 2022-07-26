import {
  Modal as MantineModal,
  ModalProps as MantineModalProps,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

interface ModalProps extends MantineModalProps {
  condition: boolean;
}

export const Modal = ({ condition, children, ...rest }: ModalProps) => {
  const [opened, handlers] = useDisclosure(false);

  return (
    <>
      {condition && (
        <MantineModal
          {...rest}
          opened={opened}
          onClose={() => handlers.close()}
        >
          {children}
        </MantineModal>
      )}
    </>
  );
};
