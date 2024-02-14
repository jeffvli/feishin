import { useCallback, useMemo, useState } from 'react';
import { Reorder } from 'framer-motion';
import isEqual from 'lodash/isEqual';
import { useTranslation } from 'react-i18next';
import { Button } from '/@/renderer/components';
import {
    useSettingsStoreActions,
    useGeneralSettings,
    HomeItem,
} from '../../../../store/settings.store';
import { SettingsOptions } from '/@/renderer/features/settings/components/settings-option';
import { DraggableItem } from '/@/renderer/features/settings/components/general/draggable-item';

export const HomeSettings = () => {
    const { t } = useTranslation();
    const { homeItems } = useGeneralSettings();
    const { setHomeItems } = useSettingsStoreActions();
    const [open, setOpen] = useState(false);

    const translatedSidebarItemMap = useMemo(
        () => ({
            [HomeItem.RANDOM]: t('page.home.explore', { postProcess: 'sentenceCase' }),
            [HomeItem.RECENTLY_PLAYED]: t('page.home.recentlyPlayed', {
                postProcess: 'sentenceCase',
            }),
            [HomeItem.RECENTLY_ADDED]: t('page.home.newlyAdded', { postProcess: 'sentenceCase' }),
            [HomeItem.MOST_PLAYED]: t('page.home.mostPlayed', { postProcess: 'sentenceCase' }),
        }),
        [t],
    );

    const [localHomeItems, setLocalHomeItems] = useState(homeItems);

    const handleSave = () => {
        setHomeItems(localHomeItems);
    };

    const handleChangeDisabled = useCallback((id: string, e: boolean) => {
        setLocalHomeItems((items) =>
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

    const isSaveButtonDisabled = isEqual(homeItems, localHomeItems);

    return (
        <>
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
                description={t('setting.homeConfiguration', {
                    context: 'description',
                    postProcess: 'sentenceCase',
                })}
                title={t('setting.homeConfiguration', { postProcess: 'sentenceCase' })}
            />
            {open && (
                <Reorder.Group
                    axis="y"
                    values={localHomeItems}
                    onReorder={setLocalHomeItems}
                >
                    {localHomeItems.map((item) => (
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
