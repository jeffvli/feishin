import { useTranslation } from 'react-i18next';

import { useEqualizerModalStore } from './equalizer-modal.store';

import { Button } from '/@/shared/components/button/button';

export const EqualizerEntry = () => {
    const { t } = useTranslation();
    const open = useEqualizerModalStore((s) => s.open);
    return (
        <Button onClick={open} variant="subtle">
            {t('equalizer.openLabel')}
        </Button>
    );
};
