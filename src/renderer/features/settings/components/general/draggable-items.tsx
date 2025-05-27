import isEqual from 'lodash/isEqual';
import { Reorder } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DraggableItem } from '/@/renderer/features/settings/components/general/draggable-item';
import { SettingsOptions } from '/@/renderer/features/settings/components/settings-option';
import { useSettingSearchContext } from '/@/renderer/features/settings/context/search-context';
import { SortableItem } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Divider } from '/@/shared/components/divider/divider';

export type DraggableItemsProps<K, T> = {
    description: string;
    itemLabels: Array<[K, string]>;
    setItems: (items: T[]) => void;
    settings: T[];
    title: string;
};

export const DraggableItems = <K extends string, T extends SortableItem<K>>({
    description,
    itemLabels,
    setItems,
    settings,
    title,
}: DraggableItemsProps<K, T>) => {
    const { t } = useTranslation();
    const keyword = useSettingSearchContext();
    const [open, setOpen] = useState(false);

    const translatedItemMap = useMemo(
        () =>
            Object.fromEntries(
                itemLabels.map((label) => [label[0], t(label[1], { postProcess: 'sentenceCase' })]),
            ) as Record<K, string>,
        [itemLabels, t],
    );

    const [localItems, setLocalItems] = useState(settings);

    const handleChangeDisabled = useCallback((id: string, e: boolean) => {
        setLocalItems((items) =>
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

    const titleText = t(title, { postProcess: 'sentenceCase' });
    const descriptionText = t(description, {
        context: 'description',
        postProcess: 'sentenceCase',
    });

    const shouldShow = useMemo(() => {
        return (
            keyword === '' ||
            title.toLocaleLowerCase().includes(keyword) ||
            description.toLocaleLowerCase().includes(keyword)
        );
    }, [description, keyword, title]);

    if (!shouldShow) {
        return <></>;
    }

    const isSaveButtonDisabled = isEqual(settings, localItems);

    const handleSave = () => {
        setItems(localItems);
    };

    return (
        <>
            <SettingsOptions
                control={
                    <>
                        {open && (
                            <Button
                                disabled={isSaveButtonDisabled}
                                onClick={handleSave}
                                size="compact-md"
                                variant="filled"
                            >
                                {t('common.save', { postProcess: 'titleCase' })}
                            </Button>
                        )}
                        <Button
                            onClick={() => setOpen(!open)}
                            size="compact-md"
                            variant={open ? 'subtle' : 'filled'}
                        >
                            {t(open ? 'common.close' : 'common.edit', { postProcess: 'titleCase' })}
                        </Button>
                    </>
                }
                description={descriptionText}
                title={titleText}
            />
            {open && (
                <Reorder.Group
                    axis="y"
                    onReorder={setLocalItems}
                    style={{ userSelect: 'none' }}
                    values={localItems}
                >
                    {localItems.map((item) => (
                        <DraggableItem
                            handleChangeDisabled={handleChangeDisabled}
                            item={item}
                            key={item.id}
                            value={translatedItemMap[item.id]}
                        />
                    ))}
                </Reorder.Group>
            )}
            <Divider />
        </>
    );
};
