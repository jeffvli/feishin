import { ChangeEvent, useCallback, useState } from 'react';
import { Group } from '@mantine/core';
import { Reorder, useDragControls } from 'framer-motion';
import isEqual from 'lodash/isEqual';
import { useTranslation } from 'react-i18next';
import { MdDragIndicator } from 'react-icons/md';
import { Button, Checkbox, Switch } from '/@/renderer/components';
import { useSettingsStoreActions, useGeneralSettings } from '../../../../store/settings.store';
import { SettingsOptions } from '/@/renderer/features/settings/components/settings-option';

const DragHandle = ({ dragControls }: any) => {
    return (
        <MdDragIndicator
            color="white"
            style={{ cursor: 'grab' }}
            onPointerDown={(event) => dragControls.start(event)}
        />
    );
};

interface SidebarItem {
    disabled: boolean;
    id: string;
}

interface DraggableSidebarItemProps {
    handleChangeDisabled: (id: string, e: boolean) => void;
    item: SidebarItem;
}

const DraggableSidebarItem = ({ item, handleChangeDisabled }: DraggableSidebarItemProps) => {
    const dragControls = useDragControls();

    return (
        <Reorder.Item
            as="div"
            dragControls={dragControls}
            dragListener={false}
            value={item}
        >
            <Group
                noWrap
                h="3rem"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,.1)' }}
            >
                <Checkbox
                    checked={!item.disabled}
                    onChange={(e) => handleChangeDisabled(item.id, e.target.checked)}
                />
                <DragHandle dragControls={dragControls} />
                {item.id}
            </Group>
        </Reorder.Item>
    );
};

export const SidebarSettings = () => {
    const { t } = useTranslation();
    const settings = useGeneralSettings();
    const { setSidebarItems, setSettings } = useSettingsStoreActions();

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
                    <Button
                        compact
                        disabled={isSaveButtonDisabled}
                        variant="filled"
                        onClick={handleSave}
                    >
                        {t('common.save', { postProcess: 'titleCase' })}
                    </Button>
                }
                description={t('setting.sidebarCollapsedNavigation', {
                    context: 'description',
                    postProcess: 'sentenceCase',
                })}
                title={t('setting.sidebarConfiguration', { postProcess: 'sentenceCase' })}
            />
            <Reorder.Group
                axis="y"
                values={localSidebarItems}
                onReorder={setLocalSidebarItems}
            >
                {localSidebarItems.map((item) => (
                    <DraggableSidebarItem
                        key={item.id}
                        handleChangeDisabled={handleChangeDisabled}
                        item={item}
                    />
                ))}
            </Reorder.Group>
        </>
    );
};
