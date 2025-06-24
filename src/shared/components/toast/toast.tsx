import type { NotificationsProps as MantineNotificationProps } from '@mantine/notifications';

import {
    cleanNotifications,
    cleanNotificationsQueue,
    hideNotification,
    notifications,
    updateNotification,
} from '@mantine/notifications';
import clsx from 'clsx';

import styles from './toast.module.css';

interface NotificationProps extends MantineNotificationProps {
    message?: string;
    onClose?: () => void;
    type?: 'error' | 'info' | 'success' | 'warning';
}

const getTitle = (type: NotificationProps['type']) => {
    if (type === 'success') return 'Success';
    if (type === 'warning') return 'Warning';
    if (type === 'error') return 'Error';
    return 'Info';
};

const showToast = ({ message, onClose, type, ...props }: NotificationProps) => {
    return notifications.show({
        autoClose: props.autoClose,
        classNames: {
            body: styles.body,
            closeButton: styles.closeButton,
            description: styles.description,
            loader: styles.loader,
            root: clsx(styles.root, {
                [styles.error]: type === 'error',
                [styles.info]: type === 'info',
                [styles.success]: type === 'success',
                [styles.warning]: type === 'warning',
            }),
            title: styles.title,
        },
        message: message ?? '',
        onClose,
        title: getTitle(type),
        withBorder: true,
        withCloseButton: true,
    });
};

export const toast = {
    clean: cleanNotifications,
    cleanQueue: cleanNotificationsQueue,
    error: (props: NotificationProps) => showToast({ type: 'error', ...props }),
    hide: hideNotification,
    info: (props: NotificationProps) => showToast({ type: 'info', ...props }),
    show: showToast,
    success: (props: NotificationProps) => showToast({ type: 'success', ...props }),
    update: updateNotification,
    warn: (props: NotificationProps) => showToast({ type: 'warning', ...props }),
};
