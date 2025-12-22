import { t } from 'i18next';
import isElectron from 'is-electron';

import { toast } from '/@/shared/components/toast/toast';

const ipc = isElectron() ? window.api.ipc : null;

export const openRestartRequiredToast = (message?: string) => {
    return toast.warn({
        autoClose: false,
        id: 'restart-toast',
        message:
            message ||
            t('common.forceRestartRequired', {
                postProcess: 'sentenceCase',
            }),
        onClose: () => {
            ipc?.send('app-restart');
        },
        title: t('common.restartRequired', {
            postProcess: 'sentenceCase',
        }),
    });
};
