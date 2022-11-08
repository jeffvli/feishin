import React from 'react';
import {
  Modal as MantineModal,
  ModalProps as MantineModalProps,
} from '@mantine/core';
import { ContextModalProps } from '@mantine/modals';

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

export type ContextModalVars = {
  context: ContextModalProps['context'];
  id: ContextModalProps['id'];
};

export const BaseContextModal = ({
  context,
  id,
  innerProps,
}: ContextModalProps<{
  modalBody: (vars: ContextModalVars) => React.ReactNode;
}>) => <>{innerProps.modalBody({ context, id })}</>;

Modal.defaultProps = {
  children: undefined,
};
