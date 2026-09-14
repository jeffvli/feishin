import { openContextModal } from '@mantine/modals';

export const openFullScreenPlayerSettingsModal = () => {
    openContextModal({
        innerProps: {},
        modal: 'fullScreenPlayerSettings',
        overlayProps: {
            blur: 0,
            opacity: 0,
        },
        size: 'xl',
        transitionProps: {
            transition: 'pop',
        },
        withCloseButton: false,
    });
};
