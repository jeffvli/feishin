import React, { ReactNode } from 'react';
import {
  ModalProps as MantineModalProps,
  Stack,
  Modal as MantineModal,
  Flex,
  Group,
} from '@mantine/core';
import { closeAllModals, ContextModalProps } from '@mantine/modals';
import { Button } from '/@/renderer/components/button';

export interface ModalProps extends Omit<MantineModalProps, 'onClose'> {
  children?: ReactNode;
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

interface ConfirmModalProps {
  children: ReactNode;
  disabled?: boolean;
  labels?: {
    cancel?: string;
    confirm?: string;
  };
  loading?: boolean;
  onCancel?: () => void;
  onConfirm: () => void;
}

export const ConfirmModal = ({
  loading,
  disabled,
  labels,
  onCancel,
  onConfirm,
  children,
}: ConfirmModalProps) => {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      closeAllModals();
    }
  };

  return (
    <Stack>
      <Flex>{children}</Flex>
      <Group position="right">
        <Button
          data-focus
          variant="default"
          onClick={handleCancel}
        >
          {labels?.cancel ? labels.cancel : 'Cancel'}
        </Button>
        <Button
          disabled={disabled}
          loading={loading}
          variant="filled"
          onClick={onConfirm}
        >
          {labels?.confirm ? labels.confirm : 'Confirm'}
        </Button>
      </Group>
    </Stack>
  );
};
