import { openModal } from '@mantine/modals';
import { useCallback } from 'react';

import { ExportImportSettingsModal } from '/@/renderer/components/export-import-settings-modal/export-import-settings-modal';
import { SettingsOptions } from '/@/renderer/features/settings/components/settings-option';
import { useSettingsStore } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';

export const ExportImportSettings = () => {
    const settingsStore = useSettingsStore();

    const onExportSettings = useCallback(() => {
        const settingsFile = new File(
            [
                JSON.stringify({
                    ...settingsStore,
                    actions: undefined,
                }),
            ],
            'feishin-settings.json',
            {
                type: 'application/json',
            },
        );

        const settingsFileLink = document.createElement('a');
        const settingsFilesUrl = URL.createObjectURL(settingsFile);
        settingsFileLink.href = settingsFilesUrl;
        settingsFileLink.download = settingsFile.name;
        settingsFileLink.click();

        URL.revokeObjectURL(settingsFilesUrl);
    }, [settingsStore]);

    const openImportModal = () => {
        openModal({
            children: <ExportImportSettingsModal />,
            size: 'lg',
            title: 'Import Feishin Settings',
        });
    };

    return (
        <>
            <SettingsOptions
                control={
                    <>
                        <Button onClick={onExportSettings}>Export Settings</Button>
                        <Button onClick={openImportModal}>Import Settings</Button>
                    </>
                }
                description="Export and Import settings via JSON"
                title="Import / Export Settings"
            />
        </>
    );
};
