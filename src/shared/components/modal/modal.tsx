import { Modal as MantineModal, ModalProps as MantineModalProps } from '@mantine/core';
import {
    closeAllModals as closeAllModalsMantine,
    ContextModalProps,
    ModalsProvider as MantineModalsProvider,
    ModalsProviderProps as MantineModalsProviderProps,
    openModal as openModalMantine,
} from '@mantine/modals';
import React, { ReactNode } from 'react';

import styles from './modal.module.css';

import { Button } from '/@/shared/components/button/button';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';
import { Stack } from '/@/shared/components/stack/stack';

export const openModal = openModalMantine;

export const closeAllModals = closeAllModalsMantine;

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
            centered={true}
            classNames={{
                body: styles.body,
                close: styles.close,
                content: styles.content,
                header: styles.header,
                inner: styles.inner,
                overlay: styles.overlay,
                root: styles.root,
                title: styles.title,
                ...classNames,
            }}
            closeButtonProps={{
                icon: <Icon icon="x" size="xl" />,
            }}
            onClose={handlers.close}
            overlayProps={{
                backgroundOpacity: 0.5,
                blur: 1,
            }}
            radius="xl"
            scrollAreaComponent={ScrollArea}
            transitionProps={{
                duration: 300,
                exitDuration: 300,
                transition: 'fade' as const,
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
                <Button disabled={loading} onClick={handleCancel} variant="default">
                    {labels?.cancel ? labels.cancel : 'Cancel'}
                </Button>
                <Button
                    data-autofocus
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
                    close: styles.close,
                    content: styles.content,
                    header: styles.header,
                    inner: styles.inner,
                    overlay: styles.overlay,
                    root: styles.root,
                    title: styles.title,
                },
                closeButtonProps: {
                    icon: <Icon icon="x" size="xl" />,
                },
                overlayProps: {
                    backgroundOpacity: 0.5,
                    blur: 1,
                },
                radius: 'xl',
                scrollAreaComponent: ScrollArea,
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
