import { useTranslation } from 'react-i18next';
import { SettingsOptions } from '/@/renderer/features/settings/components/settings-option';
import { useState } from 'react';
import { Button, Checkbox } from '/@/renderer/components';
import { Divider, Stack } from '@mantine/core';
import {
    CONFIGURABLE_CONTEXT_MENU_ITEMS,
    CONTEXT_MENU_ITEM_MAPPING,
} from '/@/renderer/features/context-menu';
import { useSettingsStore, useSettingsStoreActions } from '/@/renderer/store';

export const ContextMenuSettings = () => {
    const disabledItems = useSettingsStore((state) => state.general.disabledContextMenu);
    const { toggleContextMenuItem } = useSettingsStoreActions();
    const [open, setOpen] = useState(false);
    const { t } = useTranslation();

    return (
        <>
            <SettingsOptions
                control={
                    <Button
                        compact
                        variant="filled"
                        onClick={() => setOpen(!open)}
                    >
                        {t(open ? 'common.close' : 'common.edit', { postProcess: 'titleCase' })}
                    </Button>
                }
                description={t('setting.contextMenu', {
                    context: 'description',
                    postProcess: 'sentenceCase',
                })}
                title={t('setting.contextMenu', {
                    postProcess: 'sentenceCase',
                })}
            />
            {open && (
                <Stack>
                    {CONFIGURABLE_CONTEXT_MENU_ITEMS.map((item) => (
                        <Checkbox
                            key={item}
                            checked={!disabledItems[item]}
                            label={t(
                                `page.contextMenu.${CONTEXT_MENU_ITEM_MAPPING[item] || item}`,
                                {
                                    postProcess: 'sentenceCase',
                                },
                            )}
                            onChange={() => toggleContextMenuItem(item)}
                        />
                    ))}
                </Stack>
            )}
            <Divider />
        </>
    );
};
