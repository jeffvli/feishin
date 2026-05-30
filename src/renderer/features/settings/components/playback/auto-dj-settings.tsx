import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import {
    AUTO_DJ_MODE,
    AUTO_DJ_STRATEGY,
    type AutoDJStrategy,
    useAutoDJSettings,
    useSettingsStoreActions,
} from '/@/renderer/store/settings.store';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Select } from '/@/shared/components/select/select';

export const AutoDJSettings = memo(() => {
    const { t } = useTranslation();
    const settings = useAutoDJSettings();
    const { setSettings } = useSettingsStoreActions();

    const itemLabels = useMemo(() => {
        return {
            description: t('setting.autoDJ_itemCount_description'),
            title: t('setting.autoDJ_itemCount'),
        };
    }, [t]);

    const strategySelectData = useMemo(
        () => [
            {
                label: t('setting.autoDJ_strategy_option_similar'),
                value: AUTO_DJ_STRATEGY.SIMILAR,
            },
            {
                label: t('setting.autoDJ_strategy_option_library_random'),
                value: AUTO_DJ_STRATEGY.LIBRARY_RANDOM,
            },
        ],
        [t],
    );

    const autoDJOptions: SettingOption[] = [
        {
            control: (
                <SegmentedControl
                    data={[
                        { label: t('setting.autoDJ_mode_songs'), value: AUTO_DJ_MODE.SONGS },
                        { label: t('setting.autoDJ_mode_albums'), value: AUTO_DJ_MODE.ALBUMS },
                    ]}
                    onChange={(value) => {
                        setSettings({
                            autoDJ: {
                                mode: value as 'albums' | 'songs',
                            },
                        });
                    }}
                    size="sm"
                    value={settings.mode}
                    w="100%"
                />
            ),
            description: t('setting.autoDJ_mode_description'),
            title: t('setting.autoDJ_mode'),
        },
        {
            control: (
                <Select
                    data={strategySelectData}
                    onChange={(value) =>
                        value &&
                        setSettings({
                            autoDJ: {
                                songStrategy: value as AutoDJStrategy,
                            },
                        })
                    }
                    value={settings.songStrategy ?? AUTO_DJ_STRATEGY.SIMILAR}
                    w="100%"
                />
            ),
            description: '',
            title: t('setting.autoDJ_songStrategy'),
        },
        {
            control: (
                <Select
                    data={strategySelectData}
                    onChange={(value) =>
                        value &&
                        setSettings({
                            autoDJ: {
                                albumStrategy: value as AutoDJStrategy,
                            },
                        })
                    }
                    value={settings.albumStrategy ?? AUTO_DJ_STRATEGY.SIMILAR}
                    w="100%"
                />
            ),
            description: '',
            title: t('setting.autoDJ_albumStrategy'),
        },
        {
            control: (
                <NumberInput
                    aria-label={itemLabels.title}
                    hideControls={false}
                    max={50}
                    min={1}
                    onChange={(e) => {
                        setSettings({
                            autoDJ: {
                                itemCount: Number(e),
                            },
                        });
                    }}
                    value={Number(settings.itemCount)}
                />
            ),
            description: itemLabels.description,
            title: itemLabels.title,
        },
        {
            control: (
                <NumberInput
                    aria-label="Auto DJ timing"
                    hideControls={false}
                    max={5}
                    min={1}
                    onChange={(e) => {
                        setSettings({
                            autoDJ: {
                                timing: Number(e),
                            },
                        });
                    }}
                    value={Number(settings.timing)}
                />
            ),
            description: t('setting.autoDJ_timing', {
                context: 'description',
            }),
            title: t('setting.autoDJ_timing'),
        },
    ];

    return <SettingsSection options={autoDJOptions} title={t('setting.autoDJ')} />;
});
