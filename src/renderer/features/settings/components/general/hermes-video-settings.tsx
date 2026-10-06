import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import {
    useHermesUrl,
    useHermesVideoActions,
} from '/@/renderer/features/hermes-video/store/hermes-video.store';
import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { TextInput } from '/@/shared/components/text-input/text-input';

export const HermesVideoSettings = memo(() => {
    const { t } = useTranslation();
    const url = useHermesUrl();
    const { setUrl } = useHermesVideoActions();

    const options: SettingOption[] = [
        {
            control: (
                <TextInput
                    aria-label="Hermes Music address"
                    defaultValue={url}
                    onChange={(e) => setUrl(e.currentTarget.value)}
                    placeholder="http://umbrel.local:3340"
                    w={260}
                />
            ),
            description: t('setting.hermesMusicUrl', { context: 'description' }),
            title: t('setting.hermesMusicUrl'),
        },
    ];

    return <SettingsSection options={options} title={t('page.setting.musicVideos')} />;
});
