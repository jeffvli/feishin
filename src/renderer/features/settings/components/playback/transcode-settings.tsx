import { NumberInput, Switch, TextInput } from '/@/renderer/components';
import { usePlaybackSettings, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { SettingOption, SettingsSection } from '../settings-section';
import { useTranslation } from 'react-i18next';

export const TranscodeSettings = () => {
    const { t } = useTranslation();
    const { transcode } = usePlaybackSettings();
    const { setTranscodingConfig } = useSettingsStoreActions();
    const note = t('setting.transcodeNote', { postProcess: 'sentenceCase' });

    const transcodeOptions: SettingOption[] = [
        {
            control: (
                <Switch
                    aria-label="Toggle transcode"
                    defaultChecked={transcode.enabled}
                    onChange={(e) => {
                        setTranscodingConfig({
                            ...transcode,
                            enabled: e.currentTarget.checked,
                        });
                    }}
                />
            ),
            description: t('setting.transcode', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            note,
            title: t('setting.transcode', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <NumberInput
                    aria-label="Transcode bitrate"
                    defaultValue={transcode.bitrate}
                    min={0}
                    w={100}
                    onBlur={(e) => {
                        setTranscodingConfig({
                            ...transcode,
                            bitrate: e.currentTarget.value
                                ? Number(e.currentTarget.value)
                                : undefined,
                        });
                    }}
                />
            ),
            description: t('setting.transcodeBitrate', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !transcode.enabled,
            note,
            title: t('setting.transcodeBitrate', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <TextInput
                    aria-label="transcoding format"
                    defaultValue={transcode.format}
                    placeholder="mp3, opus"
                    width={100}
                    onBlur={(e) => {
                        setTranscodingConfig({
                            ...transcode,
                            format: e.currentTarget.value || undefined,
                        });
                    }}
                />
            ),
            description: t('setting.transcodeFormat', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            isHidden: !transcode.enabled,
            note,
            title: t('setting.transcodeFormat', { postProcess: 'sentenceCase' }),
        },
    ];

    return (
        <SettingsSection
            divider
            options={transcodeOptions}
        />
    );
};
