import { ChangeEvent, memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SidebarReorder } from '/@/renderer/features/settings/components/general/sidebar-reorder';
import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useGeneralSettings, useSettingsStoreActions } from '/@/renderer/store';
import { ColorInput } from '/@/shared/components/color-input/color-input';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Select } from '/@/shared/components/select/select';
import { Switch } from '/@/shared/components/switch/switch';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { useDebouncedCallback } from '/@/shared/hooks/use-debounced-callback';

type FolderView = 'navigation' | 'single' | 'tree';
type PlaylistMode = 'compact' | 'expanded';

export const SidebarSettings = memo(() => {
    const { t } = useTranslation();
    const settings = useGeneralSettings();
    const { setSettings } = useSettingsStoreActions();

    const handleSetSidebarPlaylistFolders = (e: ChangeEvent<HTMLInputElement>) => {
        setSettings({
            general: {
                sidebarPlaylistFolders: e.target.checked,
            },
        });
    };

    const handleSetSidebarPlaylistList = (e: ChangeEvent<HTMLInputElement>) => {
        setSettings({
            general: {
                sidebarPlaylistList: e.target.checked,
            },
        });
    };

    const handleSetSidebarPlaylistSorting = (e: ChangeEvent<HTMLInputElement>) => {
        setSettings({
            general: {
                sidebarPlaylistSorting: e.target.checked,
            },
        });
    };

    const handleSetSidebarCollapsedNavigation = (e: ChangeEvent<HTMLInputElement>) => {
        setSettings({
            general: {
                sidebarCollapsedNavigation: e.target.checked,
            },
        });
    };

    const [localFilterRegex, setLocalFilterRegex] = useState(
        settings.sidebarPlaylistListFilterRegex,
    );

    useEffect(() => {
        setLocalFilterRegex(settings.sidebarPlaylistListFilterRegex);
    }, [settings.sidebarPlaylistListFilterRegex]);

    const debouncedSetFilterRegex = useDebouncedCallback((value: string) => {
        setSettings({
            general: {
                sidebarPlaylistListFilterRegex: value,
            },
        });
    }, 500);

    const [localSeparator, setLocalSeparator] = useState(settings.sidebarPlaylistFolderSeparator);

    useEffect(() => {
        setLocalSeparator(settings.sidebarPlaylistFolderSeparator);
    }, [settings.sidebarPlaylistFolderSeparator]);

    const debouncedSetSeparator = useDebouncedCallback((value: string) => {
        if (value.length === 0) return;
        setSettings({
            general: {
                sidebarPlaylistFolderSeparator: value,
            },
        });
    }, 500);

    const folderViewOptions: Array<{ label: string; value: FolderView }> = [
        {
            label: t('setting.sidebarPlaylistFolderView_optionSingle', {
                postProcess: 'sentenceCase',
            }),
            value: 'single',
        },
        {
            label: t('setting.sidebarPlaylistFolderView_optionTree', {
                postProcess: 'sentenceCase',
            }),
            value: 'tree',
        },
        {
            label: t('setting.sidebarPlaylistFolderView_optionNavigation', {
                postProcess: 'sentenceCase',
            }),
            value: 'navigation',
        },
    ];

    const playlistModeOptions: Array<{ label: string; value: PlaylistMode }> = [
        {
            label: t('setting.sidebarPlaylistMode_optionCompact', {
                postProcess: 'sentenceCase',
            }),
            value: 'compact',
        },
        {
            label: t('setting.sidebarPlaylistMode_optionExpanded', {
                postProcess: 'sentenceCase',
            }),
            value: 'expanded',
        },
    ];

    const foldersEnabled = settings.sidebarPlaylistFolders;
    const isTreeView = settings.sidebarPlaylistFolderView === 'tree';

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
            }),
            title: t('setting.sidebarPlaylistList'),
        },
        {
            control: (
                <TextInput
                    onChange={(e) => {
                        const value = e.currentTarget.value;
                        setLocalFilterRegex(value);
                        debouncedSetFilterRegex(value);
                    }}
                    placeholder={t('setting.sidebarPlaylistListFilterRegex_placeholder')}
                    value={localFilterRegex}
                />
            ),
            description: t('setting.sidebarPlaylistListFilterRegex', {
                context: 'description',
            }),
            title: t('setting.sidebarPlaylistListFilterRegex'),
        },
        {
            control: (
                <Switch
                    checked={settings.sidebarPlaylistSorting}
                    onChange={handleSetSidebarPlaylistSorting}
                />
            ),
            description: t('setting.sidebarPlaylistSorting', {
                context: 'description',
            }),
            title: t('setting.sidebarPlaylistSorting'),
        },
        {
            control: (
                <Select
                    data={playlistModeOptions}
                    onChange={(value) => {
                        if (!value) return;
                        setSettings({
                            general: {
                                sidebarPlaylistMode: value as PlaylistMode,
                            },
                        });
                    }}
                    value={settings.sidebarPlaylistMode}
                    width={200}
                />
            ),
            description: t('setting.sidebarPlaylistMode', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.sidebarPlaylistMode', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    checked={settings.sidebarPlaylistFolders}
                    onChange={handleSetSidebarPlaylistFolders}
                />
            ),
            description: t('setting.sidebarPlaylistFolders', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            title: t('setting.sidebarPlaylistFolders', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <TextInput
                    onChange={(e) => {
                        const value = e.currentTarget.value;
                        setLocalSeparator(value);
                        debouncedSetSeparator(value);
                    }}
                    value={localSeparator}
                    width={120}
                />
            ),
            description: t('setting.sidebarPlaylistFolderSeparator', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            indent: true,
            isHidden: !foldersEnabled,
            title: t('setting.sidebarPlaylistFolderSeparator', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Select
                    data={folderViewOptions}
                    onChange={(value) => {
                        if (!value) return;
                        setSettings({
                            general: {
                                sidebarPlaylistFolderView: value as FolderView,
                            },
                        });
                    }}
                    value={settings.sidebarPlaylistFolderView}
                    width={200}
                />
            ),
            description: t('setting.sidebarPlaylistFolderView', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            indent: true,
            isHidden: !foldersEnabled,
            title: t('setting.sidebarPlaylistFolderView', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <NumberInput
                    max={64}
                    min={0}
                    onBlur={(e) => {
                        const value = Number(e.currentTarget.value);
                        if (Number.isFinite(value)) {
                            setSettings({
                                general: {
                                    sidebarPlaylistFolderTreeIndent: Math.max(
                                        0,
                                        Math.min(64, Math.round(value)),
                                    ),
                                },
                            });
                        }
                    }}
                    value={settings.sidebarPlaylistFolderTreeIndent}
                    width={100}
                />
            ),
            description: t('setting.sidebarPlaylistFolderTreeIndent', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            indent: true,
            isHidden: !foldersEnabled || !isTreeView,
            title: t('setting.sidebarPlaylistFolderTreeIndent', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <ColorInput
                    format="rgba"
                    onChangeEnd={(value) => {
                        setSettings({
                            general: {
                                sidebarPlaylistFolderTreeLineColor: value,
                            },
                        });
                    }}
                    value={settings.sidebarPlaylistFolderTreeLineColor}
                />
            ),
            description: t('setting.sidebarPlaylistFolderTreeLineColor', {
                context: 'description',
                postProcess: 'sentenceCase',
            }),
            indent: true,
            isHidden: !foldersEnabled || !isTreeView,
            title: t('setting.sidebarPlaylistFolderTreeLineColor', { postProcess: 'sentenceCase' }),
        },
        {
            control: (
                <Switch
                    checked={settings.sidebarCollapsedNavigation}
                    onChange={handleSetSidebarCollapsedNavigation}
                />
            ),
            description: t('setting.sidebarCollapsedNavigation', {
                context: 'description',
            }),
            title: t('setting.sidebarCollapsedNavigation'),
        },
        {
            control: (
                <Switch
                    aria-label="Show lyrics in attached play queue"
                    defaultChecked={settings.showLyricsInSidebar}
                    onChange={(e) => {
                        setSettings({
                            general: {
                                showLyricsInSidebar: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.showLyricsInSidebar', {
                context: 'description',
            }),
            title: t('setting.showLyricsInSidebar'),
        },
        {
            control: (
                <Switch
                    aria-label="Show visualizer in sidebar"
                    defaultChecked={settings.showVisualizerInSidebar}
                    onChange={(e) => {
                        setSettings({
                            general: {
                                showVisualizerInSidebar: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.showVisualizerInSidebar', {
                context: 'description',
            }),
            title: t('setting.showVisualizerInSidebar'),
        },
        {
            control: (
                <Switch
                    aria-label="Combine lyrics and visualizer"
                    defaultChecked={settings.combinedLyricsAndVisualizer}
                    onChange={(e) => {
                        setSettings({
                            general: {
                                combinedLyricsAndVisualizer: e.currentTarget.checked,
                            },
                        });
                    }}
                />
            ),
            description: t('setting.combinedLyricsAndVisualizer', {
                context: 'description',
            }),
            title: t('setting.combinedLyricsAndVisualizer'),
        },
    ];

    return (
        <SettingsSection
            extra={<SidebarReorder />}
            options={options}
            title={t('page.setting.sidebar')}
        />
    );
});
