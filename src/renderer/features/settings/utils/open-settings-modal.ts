import { openContextModal } from '@mantine/modals';

export const openSettingsModal = () => {
    openContextModal({
        innerProps: {},
        modalKey: 'settings',
        overlayProps: {
            opacity: 1,
        },
        size: '2xl',
        styles: {
            content: {
                height: '80%',
                maxWidth: '960px',
                minHeight: '540px',
                width: '100%',
            },
        },
        transitionProps: {
            transition: 'pop',
        },
    });
};
