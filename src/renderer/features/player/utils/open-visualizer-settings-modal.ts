import { openContextModal } from '@mantine/modals';

export const openVisualizerSettingsModal = () => {
    openContextModal({
        innerProps: {},
        modalKey: 'visualizerSettings',
        overlayProps: {
            blur: 0,
            opacity: 1,
        },
        size: 'xl',
        styles: {
            content: {
                height: '90%',
                maxWidth: '1400px',
                minHeight: '600px',
                width: '100%',
            },
        },
        title: 'Visualizer Settings',
        transitionProps: {
            transition: 'pop',
        },
    });
};
