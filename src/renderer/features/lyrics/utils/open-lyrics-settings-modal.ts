import { openContextModal } from '@mantine/modals';

export const openLyricsSettingsModal = (settingsKey: string = 'default') => {
    openContextModal({
        innerProps: { settingsKey },
        modal: 'lyricsSettings',
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
