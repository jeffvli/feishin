import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    CONFIGURABLE_CONTEXT_MENU_ITEMS,
    CONTEXT_MENU_ITEM_MAPPING,
} from '/@/renderer/features/context-menu';
import { SettingsOptions } from '/@/renderer/features/settings/components/settings-option';
import { useSettingsStore, useSettingsStoreActions } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { Divider } from '/@/shared/components/divider/divider';
import { Stack } from '/@/shared/components/stack/stack';

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
                        onClick={() => setOpen(!open)}
                        size="compact-md"
                        variant="filled"
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
                            checked={!disabledItems[item]}
                            key={item}
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
