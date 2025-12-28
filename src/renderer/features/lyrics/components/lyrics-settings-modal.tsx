import { ContextModalProps } from '@mantine/modals';

import { LyricsSettingsForm } from './lyrics-settings-form';

export const LyricsSettingsContextModal = ({
    innerProps,
}: ContextModalProps<{ settingsKey: string }>) => {
    return <LyricsSettingsForm settingsKey={innerProps.settingsKey} />;
};
