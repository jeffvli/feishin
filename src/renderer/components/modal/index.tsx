import React from 'react';
import {
  Modal as MantineModal,
  ModalProps as MantineModalProps,
} from '@mantine/core';

export interface ModalProps extends Omit<MantineModalProps, 'onClose'> {
  children?: React.ReactNode;
  handlers: {
    close: () => void;
    open: () => void;
    toggle: () => void;
  };
}

export const Modal = ({ children, handlers, ...rest }: ModalProps) => {
  return (
    <MantineModal
      overlayBlur={2}
      overlayOpacity={0.2}
      {...rest}
      onClose={handlers.close}
    >
      {children}
    </MantineModal>
  );
};

Modal.defaultProps = {
  children: undefined,
};
