import { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch } from '/@/renderer/components';
import { useSettingsStoreActions, useGeneralSettings } from '../../../../store/settings.store';
import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';

export const SidebarSettings = () => {
    const { t } = useTranslation();
    const settings = useGeneralSettings();
    const { setSettings } = useSettingsStoreActions();

    const handleSetSidebarPlaylistList = (e: ChangeEvent<HTMLInputElement>) => {
        setSettings({
            general: {
                ...settings,
                sidebarPlaylistList: e.target.checked,
            },
        });
    };

    const handleSetSidebarCollapsedNavigation = (e: ChangeEvent<HTMLInputElement>) => {
        setSettings({
            general: {
                ...settings,
                sidebarCollapsedNavigation: e.target.checked,
            },
        });
    };

    const options: SettingOption[] = [
        {
            control: (
                <Switch
                    checked={settings.sidebarPlaylistList}
                    onChange={handleSetSidebarPlaylistList}
                />
            ),
            description: t('setting.sidebarPlaylistList', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.sidebarPlaylistList', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    checked={settings.sidebarCollapsedNavigation}
                    onChange={handleSetSidebarCollapsedNavigation}
                />
            ),
            description: t('setting.sidebarPlaylistList', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.sidebarCollapsedNavigation', { postProcess: 'sentenceCase' }),
        },
    ];

    return <SettingsSection options={options} />;
};
