import { t } from 'i18next';
import { useCallback, useState } from 'react';
import { ZodError } from 'zod';

import { DiffVisualiser } from '/@/renderer/components/settings-diff-visualiser/settings-diff-visualiser';
import {
    migrateSettings,
    type SettingsState,
    useSettingsForExport,
    useSettingsStoreActions,
    ValidationSettingsStateSchema,
    VersionedSettings,
} from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { DragDropZone } from '/@/shared/components/drag-drop-zone/drag-drop-zone';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';

enum SCREENS {
    FILE_PICKER,
    DIFF_VISUALS,
    IMPORT_COMPLETE,
}

export const ExportImportSettingsModal = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Version needs to be omitted from the settings object
    const { version, ...settings } = useSettingsForExport();
    const { setSettings } = useSettingsStoreActions();

    const [currentScreen, setCurrentScreen] = useState<SCREENS>(SCREENS.FILE_PICKER);
    const [selectedSettingsFile, setSettingsFile] = useState<SettingsState>();

    const onItemSelected = useCallback((itemContents: string) => {
        const settingsFile = JSON.parse(itemContents) as VersionedSettings;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Version needs to be omitted from the settings object
        const { version, ...settings } = settingsFile;
        const parsedResult = settings as SettingsState;
        setSettingsFile(parsedResult);
        setCurrentScreen(SCREENS.DIFF_VISUALS);
    }, []);

    const validateItemSelected = useCallback(
        (itemContents: string): { error?: string; isValid: boolean } => {
            try {
                JSON.parse(itemContents);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars -- "err" is not useful and the catch cannot be empty
            } catch (err) {
                return {
                    error: t('setting.exportImportSettings_notValidJSON'),
                    isValid: false,
                };
            }

            const content = JSON.parse(itemContents);

            const migratedSettings = migrateSettings(content, content?.version || 0);
            const validationRes = ValidationSettingsStateSchema.safeParse(migratedSettings);

            if (!validationRes.success) {
                const error = validationRes.error as ZodError;
                const firstError = error.errors.pop();

                const dotPath = firstError?.path.join('.');
                const reason = firstError?.message;

                return {
                    error: t('setting.exportImportSettings_offendingKeyError', {
                        offendingKey: dotPath,
                        reason,
                    }),
                    isValid: false,
                };
            }

            return {
                isValid: true,
            };
        },
        [],
    );

    const onImportClick = useCallback(() => {
        if (selectedSettingsFile) {
            setSettings(selectedSettingsFile);
            setCurrentScreen(SCREENS.IMPORT_COMPLETE);
        }
    }, [selectedSettingsFile, setSettings]);

    return (
        <>
            {currentScreen === SCREENS.FILE_PICKER ? (
                <Stack>
                    <DragDropZone
                        icon="fileJson"
                        onItemSelected={onItemSelected}
                        validateItem={validateItemSelected}
                    />
                </Stack>
            ) : null}
            {currentScreen === SCREENS.DIFF_VISUALS ? (
                <Stack>
                    <DiffVisualiser
                        newSettings={selectedSettingsFile!}
                        originalSettings={settings}
                    />
                    <Text size="sm" ta="center">
                        {t('setting.exportImportSettings_destructiveWarning').toString()}
                    </Text>
                    <Button onClick={onImportClick} variant="state-info">
                        {t('setting.exportImportSettings_importBtn').toString()}
                    </Button>
                </Stack>
            ) : null}
            {currentScreen === SCREENS.IMPORT_COMPLETE ? (
                <Text py="md" ta="center">
                    {t('setting.exportImportSettings_importSuccess').toString()}
                </Text>
            ) : null}
        </>
    );
};
