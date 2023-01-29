import type { NotificationProps as MantineNotificationProps } from '@mantine/notifications';
import {
  showNotification,
  updateNotification,
  hideNotification,
  cleanNotifications,
  cleanNotificationsQueue,
} from '@mantine/notifications';

interface NotificationProps extends MantineNotificationProps {
  type?: 'success' | 'error' | 'warning' | 'info';
}

const showToast = ({ type, ...props }: NotificationProps) => {
  const color =
    type === 'success'
      ? 'var(--success-color)'
      : type === 'warning'
      ? 'var(--warning-color)'
      : type === 'error'
      ? 'var(--danger-color)'
      : 'var(--primary-color)';

  const defaultTitle =
    type === 'success'
      ? 'Success'
      : type === 'warning'
      ? 'Warning'
      : type === 'error'
      ? 'Error'
      : 'Info';

  const defaultDuration = type === 'error' ? 3500 : 2000;

  return showNotification({
    autoClose: defaultDuration,
    styles: () => ({
      closeButton: {},
      description: {
        color: 'var(--toast-description-fg)',
        fontSize: '.9em',
      },
      loader: {
        margin: '1rem',
      },
      root: {
        '&::before': { backgroundColor: color },
        background: 'var(--toast-bg)',
      },
      title: {
        color: 'var(--toast-title-fg)',
        fontSize: '1em',
      },
    }),
    title: defaultTitle,
    ...props,
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
