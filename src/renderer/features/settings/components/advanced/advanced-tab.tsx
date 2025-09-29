import { ExportImportSettings } from '/@/renderer/features/settings/components/advanced/export-import-settings';
import { StylesSettings } from '/@/renderer/features/settings/components/advanced/styles-settings';
import { Stack } from '/@/shared/components/stack/stack';

export const AdvancedTab = () => {
    return (
        <Stack gap="md">
            <StylesSettings />
            <ExportImportSettings />
        </Stack>
    );
};
