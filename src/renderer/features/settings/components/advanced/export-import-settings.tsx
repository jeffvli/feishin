import { openModal } from '@mantine/modals';
import { t } from 'i18next';
import { useCallback } from 'react';

import { ExportImportSettingsModal } from '/@/renderer/components/export-import-settings-modal/export-import-settings-modal';
import { SettingsOptions } from '/@/renderer/features/settings/components/settings-option';
import { useSettingsForExport } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';

export const ExportImportSettings = () => {
    const settingForExport = useSettingsForExport();

    const onExportSettings = useCallback(() => {
        const settingsFile = new File([JSON.stringify(settingForExport)], 'feishin-settings.json', {
            type: 'application/json',
        });

        const settingsFileLink = document.createElement('a');
        const settingsFilesUrl = URL.createObjectURL(settingsFile);
        settingsFileLink.href = settingsFilesUrl;
        settingsFileLink.download = settingsFile.name;
        settingsFileLink.click();

        URL.revokeObjectURL(settingsFilesUrl);
    }, [settingForExport]);

    const openImportModal = () => {
        openModal({
            children: <ExportImportSettingsModal />,
            size: 'lg',
            title: t('setting.exportImportSettings_importModalTitle').toString(),
        });
    };

    return (
        <>
            <SettingsOptions
                control={
                    <>
                        <Button onClick={onExportSettings}>
                            {t('setting.exportImportSettings_control_exportText').toString()}
                        </Button>
                        <Button onClick={openImportModal}>
                            {t('setting.exportImportSettings_control_importText').toString()}
                        </Button>
                    </>
                }
                description={t('setting.exportImportSettings_control_description').toString()}
                title={t('setting.exportImportSettings_control_title').toString()}
            />
        </>
    );
};
