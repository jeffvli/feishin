import { t } from 'i18next';
import isElectron from 'is-electron';
import { memo } from 'react';

import { openAdministratorPasswordChangeModal } from '/@/renderer/features/settings/components/administrator-access-modal';
import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { Button } from '/@/shared/components/button/button';

export const AdministratorAccessSettings = memo(() => {
    const options: SettingOption[] = [
        {
            control: (
                <Button
                    onClick={openAdministratorPasswordChangeModal}
                    size="compact-sm"
                    variant="filled"
                >
                    {t('setting.adminLockChangePassword')}
                </Button>
            ),
            description: t('setting.adminLockSettingsDescription'),
            isHidden: !isElectron(),
            title: t('setting.adminLockChangePassword'),
        },
    ];

    return <SettingsSection options={options} title={t('setting.adminLockSettingsTitle')} />;
});
