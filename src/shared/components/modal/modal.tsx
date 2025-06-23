import { Modal as MantineModal, ModalProps as MantineModalProps } from '@mantine/core';
import { closeAllModals, ContextModalProps } from '@mantine/modals';
import {
    ModalsProvider as MantineModalsProvider,
    ModalsProviderProps as MantineModalsProviderProps,
} from '@mantine/modals';
import React, { ReactNode } from 'react';

import styles from './modal.module.css';

import { Button } from '/@/shared/components/button/button';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Stack } from '/@/shared/components/stack/stack';

export interface ModalProps extends Omit<MantineModalProps, 'onClose'> {
    children?: ReactNode;
    handlers: {
        close: () => void;
        open: () => void;
        toggle: () => void;
    };
}

export const Modal = ({ children, classNames, handlers, ...rest }: ModalProps) => {
    return (
        <MantineModal
            {...rest}
            classNames={{
                body: styles.body,
                content: styles.content,
                header: styles.header,
                root: styles.root,
                title: styles.title,
                ...classNames,
            }}
            onClose={handlers.close}
            radius="lg"
            transitionProps={{
                duration: 300,
                exitDuration: 300,
                transition: 'fade',
            }}
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
    children,
    disabled,
    labels,
    loading,
    onCancel,
    onConfirm,
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
            <Group justify="flex-end">
                <Button
                    data-focus
                    onClick={handleCancel}
                    variant="default"
                >
                    {labels?.cancel ? labels.cancel : 'Cancel'}
                </Button>
                <Button
                    disabled={disabled}
                    loading={loading}
                    onClick={onConfirm}
                    variant="filled"
                >
                    {labels?.confirm ? labels.confirm : 'Confirm'}
                </Button>
            </Group>
        </Stack>
    );
};

export interface ModalsProviderProps extends MantineModalsProviderProps {}

export const ModalsProvider = ({ children, ...rest }: ModalsProviderProps) => {
    return (
        <MantineModalsProvider
            modalProps={{
                centered: true,
                classNames: {
                    body: styles.body,
                    content: styles.content,
                    header: styles.header,
                    root: styles.root,
                    title: styles.title,
                },
                closeButtonProps: {
                    icon: <Icon icon="x" />,
                },
                radius: 'lg',
                transitionProps: {
                    duration: 300,
                    exitDuration: 300,
                    transition: 'fade',
                },
            }}
            {...rest}
        >
            {children}
        </MantineModalsProvider>
    );
};
