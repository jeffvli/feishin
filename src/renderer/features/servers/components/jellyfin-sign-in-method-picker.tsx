import { useTranslation } from 'react-i18next';

import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';

export type JellyfinSignInMethod = 'password' | 'quickConnect';

interface JellyfinSignInMethodPickerProps {
    onChange: (value: JellyfinSignInMethod) => void;
    value: JellyfinSignInMethod;
}

/**
 * Lets the user pick between signing in to a Jellyfin server with a
 * username/password or via Quick Connect. Only meaningful for Jellyfin,
 * since Quick Connect doesn't exist for Navidrome/Subsonic.
 */
export const JellyfinSignInMethodPicker = ({
    onChange,
    value,
}: JellyfinSignInMethodPickerProps) => {
    const { t } = useTranslation();

    return (
        <Stack gap="xs">
            <Text fw={600} size="sm">
                {t('form.addServer.input', { context: 'jellyfinSignInMethod' })}
            </Text>
            <SegmentedControl
                data={[
                    {
                        label: t('form.addServer.input', {
                            context: 'jellyfinSignInMethodPassword',
                        }),
                        value: 'password',
                    },
                    {
                        label: t('form.addServer.input', {
                            context: 'jellyfinSignInMethodQuickConnect',
                        }),
                        value: 'quickConnect',
                    },
                ]}
                onChange={(v) => onChange(v as JellyfinSignInMethod)}
                p="md"
                value={value}
                withItemsBorders={false}
            />
        </Stack>
    );
};
