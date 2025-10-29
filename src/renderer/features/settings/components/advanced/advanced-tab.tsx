import { ExportImportSettings } from '/@/renderer/features/settings/components/advanced/export-import-settings';
import { StylesSettings } from '/@/renderer/features/settings/components/advanced/styles-settings';
import { UpdateSettings } from '/@/renderer/features/settings/components/window/update-settings';
import { Stack } from '/@/shared/components/stack/stack';

export const AdvancedTab = () => {
    return (
        <Stack gap="md">
            <UpdateSettings />
            <StylesSettings />
            <ExportImportSettings />
        </Stack>
    );
};
