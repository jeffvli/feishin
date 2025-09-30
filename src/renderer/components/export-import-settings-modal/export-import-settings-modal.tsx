import { t } from 'i18next';
import { useCallback, useState } from 'react';

import { DiffVisualiser } from '/@/renderer/components/settings-diff-visualiser/settings-diff-visualiser';
import { SettingsState, useSettingsStore, useSettingsStoreActions } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { DragDropZone } from '/@/shared/components/drag-drop-zone/drag-drop-zone';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';

enum SCREENS {
    FILE_PICKER,
    DIFF_VISUALS,
    IMPORT_COMPLETE,
}

const compareKeysRecursive = (
    obj1: unknown,
    obj2: unknown,
    parentKey: string = '',
): { isValid: boolean; offendingKey?: string } => {
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
        return { isValid: true };
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
        return { isValid: false, offendingKey: parentKey };
    }

    for (const key of keys1) {
        if (!keys2.includes(key)) {
            const fullKey = parentKey ? `${parentKey}.${key}` : key;
            return { isValid: false, offendingKey: fullKey };
        }

        const result = compareKeysRecursive(
            obj1[key],
            obj2[key],
            parentKey ? `${parentKey}.${key}` : key,
        );

        if (!result.isValid) {
            return result;
        }
    }

    return { isValid: true };
};

const removeUndefinedKeys = (obj: Omit<SettingsState, 'actions'>) => {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    const cleanedObj: any = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
        if (obj[key] !== undefined) {
            cleanedObj[key] = removeUndefinedKeys(obj[key]);
        }
    }
    return cleanedObj;
};

export const ExportImportSettingsModal = () => {
    const { actions, ...otherSettings } = useSettingsStore();
    const { setSettings } = useSettingsStoreActions();

    const [currentScreen, setCurrentScreen] = useState<SCREENS>(SCREENS.FILE_PICKER);
    const [selectedSettingsFile, setSettingsFile] = useState<SettingsState>();

    const onItemSelected = useCallback((itemContents: string) => {
        setSettingsFile(JSON.parse(itemContents) as SettingsState);
        setCurrentScreen(SCREENS.DIFF_VISUALS);
    }, []);

    const validateItemSelected = useCallback(
        (itemContents: string): { error?: string; isValid: boolean } => {
            try {
                JSON.parse(itemContents);
            } catch (err) {
                return {
                    error: t('setting.exportImportSettings_notValidJSON'),
                    isValid: false,
                };
            }

            const parsedFile = JSON.parse(itemContents) as SettingsState;
            const { isValid, offendingKey } = compareKeysRecursive(
                removeUndefinedKeys(otherSettings),
                parsedFile,
            );

            if (!isValid) {
                return {
                    error: t('setting.exportImportSettings_offendingKeyError', {
                        offendingKey,
                    }),
                    isValid: false,
                };
            }

            return {
                isValid: true,
            };
        },
        [otherSettings],
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
                        originalSettings={otherSettings}
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
