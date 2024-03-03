import { ChangeEvent, useCallback, useMemo, useState } from 'react';
import { Reorder } from 'framer-motion';
import isEqual from 'lodash/isEqual';
import { useTranslation } from 'react-i18next';
import { Button, Switch } from '/@/renderer/components';
import { useSettingsStoreActions, useGeneralSettings } from '../../../../store/settings.store';
import { SettingsOptions } from '/@/renderer/features/settings/components/settings-option';
import { DraggableItem } from '/@/renderer/features/settings/components/general/draggable-item';

export const SidebarSettings = () => {
    const { t } = useTranslation();
    const settings = useGeneralSettings();
    const { setSidebarItems, setSettings } = useSettingsStoreActions();
    const [open, setOpen] = useState(false);

    const translatedSidebarItemMap = useMemo(
        () => ({
            Albums: t('page.sidebar.albums', { postProcess: 'titleCase' }),
            Artists: t('page.sidebar.artists', { postProcess: 'titleCase' }),
            Folders: t('page.sidebar.folders', { postProcess: 'titleCase' }),
            Genres: t('page.sidebar.genres', { postProcess: 'titleCase' }),
            Home: t('page.sidebar.home', { postProcess: 'titleCase' }),
            'Now Playing': t('page.sidebar.nowPlaying', { postProcess: 'titleCase' }),
            Playlists: t('page.sidebar.playlists', { postProcess: 'titleCase' }),
            Rescan: t('page.sidebar.rescan', { postProcess: 'titleCase' }),
            Search: t('page.sidebar.search', { postProcess: 'titleCase' }),
            Settings: t('page.sidebar.settings', { postProcess: 'titleCase' }),
            Tracks: t('page.sidebar.tracks', { postProcess: 'titleCase' }),
        }),
        [t],
    );

    const [localSidebarItems, setLocalSidebarItems] = useState(settings.sidebarItems);

    const handleSave = () => {
        setSidebarItems(localSidebarItems);
    };

    const handleChangeDisabled = useCallback((id: string, e: boolean) => {
        setLocalSidebarItems((items) =>
            items.map((item) => {
                if (item.id === id) {
                    return {
                        ...item,
                        disabled: !e,
                    };
                }

                return item;
            }),
        );
    }, []);

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

    const isSaveButtonDisabled = isEqual(settings.sidebarItems, localSidebarItems);

    return (
        <>
            <SettingsOptions
                control={
                    <Switch
                        checked={settings.sidebarPlaylistList}
                        onChange={handleSetSidebarPlaylistList}
                    />
                }
                description={t('setting.sidebarPlaylistList', {
                    context: 'description',
                    postProcess: 'sentenceCase',
                })}
                title={t('setting.sidebarPlaylistList', { postProcess: 'sentenceCase' })}
            />
            <SettingsOptions
                control={
                    <Switch
                        checked={settings.sidebarCollapsedNavigation}
                        onChange={handleSetSidebarCollapsedNavigation}
                    />
                }
                description={t('setting.sidebarPlaylistList', {
                    context: 'description',
                    postProcess: 'sentenceCase',
                })}
                title={t('setting.sidebarCollapsedNavigation', { postProcess: 'sentenceCase' })}
            />
            <SettingsOptions
                control={
                    <>
                        {open && (
                            <Button
                                compact
                                disabled={isSaveButtonDisabled}
                                variant="filled"
                                onClick={handleSave}
                            >
                                {t('common.save', { postProcess: 'titleCase' })}
                            </Button>
                        )}
                        <Button
                            compact
                            variant="filled"
                            onClick={() => setOpen(!open)}
                        >
                            {t(open ? 'common.close' : 'common.edit', { postProcess: 'titleCase' })}
                        </Button>
                    </>
                }
                description={t('setting.sidebarCollapsedNavigation', {
                    context: 'description',
                    postProcess: 'sentenceCase',
                })}
                title={t('setting.sidebarConfiguration', { postProcess: 'sentenceCase' })}
            />
            {open && (
                <Reorder.Group
                    axis="y"
                    values={localSidebarItems}
                    onReorder={setLocalSidebarItems}
                >
                    {localSidebarItems.map((item) => (
                        <DraggableItem
                            key={item.id}
                            handleChangeDisabled={handleChangeDisabled}
                            item={item}
                            value={
                                translatedSidebarItemMap[
                                    item.id as keyof typeof translatedSidebarItemMap
                                ]
                            }
                        />
                    ))}
                </Reorder.Group>
            )}
        </>
    );
};
