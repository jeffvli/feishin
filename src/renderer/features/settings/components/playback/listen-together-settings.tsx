import { memo } from 'react';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useSyncActions, useSyncSettings } from '/@/renderer/store/sync.store';
import { Switch } from '/@/shared/components/switch/switch';
import { TextInput } from '/@/shared/components/text-input/text-input';

// Settings-page counterpart to the player-bar "Listen Together" popover. The same
// store backs both, so the enable toggle and sidecar URL stay in sync wherever
// they're edited.
export const ListenTogetherSettings = memo(() => {
    const { enabled, sidecarUrl } = useSyncSettings();
    const actions = useSyncActions();

    const options: SettingOption[] = [
        {
            control: (
                <Switch
                    aria-label="Enable Listen Together"
                    checked={enabled}
                    onChange={(e) => actions.setEnabled(e.currentTarget.checked)}
                />
            ),
            description:
                'Synchronize playback with friends in a shared room. Adds a "Listen Together" control to the player bar. Turning this off leaves any active room and disconnects.',
            title: 'Enable Listen Together',
        },
        {
            control: (
                <TextInput
                    defaultValue={sidecarUrl}
                    onBlur={(e) => {
                        const url = e.currentTarget.value.trim();
                        if (url === sidecarUrl) return;
                        actions.setSidecarUrl(url);
                    }}
                    placeholder="https://party.example.com"
                />
            ),
            description:
                'Base URL of the listen-together server. The ws(s):// endpoint is derived automatically.',
            isHidden: !enabled,
            title: 'Sync server URL',
        },
    ];

    return <SettingsSection options={options} title="Listen Together" />;
});
