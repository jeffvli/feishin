import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import {
    ShareExpirationUnit,
    useGeneralSettings,
    useSettingsStoreActions,
} from '/@/renderer/store/settings.store';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Select } from '/@/shared/components/select/select';
import { Switch } from '/@/shared/components/switch/switch';

export const SharingSettings = memo(() => {
    const { t } = useTranslation();
    const settings = useGeneralSettings();
    const { setSettings } = useSettingsStoreActions();
    const { shareExpiration } = settings;

    const unitOptions = useMemo(
        () => [
            {
                label: t('datetime.secondLong'),
                value: ShareExpirationUnit.SECOND,
            },
            {
                label: t('datetime.minuteLong'),
                value: ShareExpirationUnit.MINUTE,
            },
            {
                label: t('datetime.hourLong'),
                value: ShareExpirationUnit.HOUR,
            },
            {
                label: t('datetime.dayLong'),
                value: ShareExpirationUnit.DAY,
            },
            {
                label: t('datetime.weekLong'),
                value: ShareExpirationUnit.WEEK,
            },
            {
                label: t('datetime.monthLong'),
                value: ShareExpirationUnit.MONTH,
            },
            {
                label: t('datetime.yearLong'),
                value: ShareExpirationUnit.YEAR,
            },
        ],
        [t],
    );

    const options: SettingOption[] = [
        {
            control: (
                <Switch
                    checked={shareExpiration.useServerDefault}
                    onChange={(e) => {
                        setSettings({
                            general: {
                                shareExpiration: {
                                    ...shareExpiration,
                                    useServerDefault: e.currentTarget.checked,
                                },
                            },
                        });
                    }}
                />
            ),
            description: t('setting.shareExpirationUseServerDefault', { context: 'description' }),
            title: t('setting.shareExpirationUseServerDefault'),
        },
        {
            control: (
                <Group gap="xs" wrap="nowrap">
                    <NumberInput
                        disabled={shareExpiration.useServerDefault}
                        min={1}
                        onBlur={(e) => {
                            const amount = Math.max(
                                1,
                                Math.floor(Number(e.currentTarget.value)) || 1,
                            );
                            setSettings({
                                general: {
                                    shareExpiration: {
                                        ...shareExpiration,
                                        amount,
                                    },
                                },
                            });
                        }}
                        value={shareExpiration.amount}
                        width={90}
                    />
                    <Select
                        data={unitOptions}
                        disabled={shareExpiration.useServerDefault}
                        onChange={(value) => {
                            if (!value) return;
                            setSettings({
                                general: {
                                    shareExpiration: {
                                        ...shareExpiration,
                                        unit: value as ShareExpirationUnit,
                                    },
                                },
                            });
                        }}
                        value={shareExpiration.unit}
                        w={120}
                    />
                </Group>
            ),
            description: t('setting.shareExpiration', { context: 'description' }),
            isHidden: shareExpiration.useServerDefault,
            title: t('setting.shareExpiration'),
        },
    ];

    return <SettingsSection options={options} title={t('page.setting.sharing')} />;
});
