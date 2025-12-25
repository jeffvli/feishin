import { openContextModal } from '@mantine/modals';

import i18n from '/@/i18n/i18n';

export const openVisualizerSettingsModal = () => {
    openContextModal({
        innerProps: {},
        modalKey: 'visualizerSettings',
        overlayProps: {
            blur: 0,
            opacity: 0,
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
        title: i18n.t('common.setting_other', { postProcess: 'titleCase' }),
        transitionProps: {
            transition: 'pop',
        },
    });
};
