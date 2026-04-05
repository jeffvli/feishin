import { openContextModal } from '@mantine/modals';

export const openSettingsModal = () => {
    openContextModal({
        innerProps: {},
        modal: 'settings',
        overlayProps: {
            opacity: 1,
        },
        size: '60rem',
        styles: {
            content: {
                height: '100%',
                maxWidth: '90%',
                width: '100%',
            },
        },
        transitionProps: {
            transition: 'pop',
        },
    });
};
