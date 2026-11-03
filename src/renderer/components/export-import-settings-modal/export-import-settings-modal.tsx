import { t } from 'i18next';
import { useCallback, useState } from 'react';
import { z, ZodError } from 'zod';

import { DiffVisualiser } from '/@/renderer/components/settings-diff-visualiser/settings-diff-visualiser';
import {
    ExportedRadioStations,
    ExportedRadioStationsSchema,
    importRadioStations,
} from '/@/renderer/features/radio/store/radio-store';
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
    const [selectedRadioStations, setRadioStations] = useState<ExportedRadioStations>();

    const onItemSelected = useCallback((itemContents: string) => {
        const settingsFile = JSON.parse(itemContents) as VersionedSettings & {
            radioStations?: unknown;
        };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Version needs to be omitted from the settings object
        const { radioStations, version, ...settings } = settingsFile;
        const parsedResult = settings as SettingsState;
        setSettingsFile(parsedResult);
        setRadioStations(
            radioStations ? ExportedRadioStationsSchema.parse(radioStations) : undefined,
        );
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
            const radioValidationRes = z
                .object({ radioStations: ExportedRadioStationsSchema.optional() })
                .safeParse(content);

            const failedValidation = !validationRes.success
                ? validationRes
                : !radioValidationRes.success
                  ? radioValidationRes
                  : undefined;

            if (failedValidation) {
                const error = failedValidation.error as ZodError;
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
            if (selectedRadioStations) {
                importRadioStations(selectedRadioStations);
            }
            setCurrentScreen(SCREENS.IMPORT_COMPLETE);
        }
    }, [selectedRadioStations, selectedSettingsFile, setSettings]);

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
