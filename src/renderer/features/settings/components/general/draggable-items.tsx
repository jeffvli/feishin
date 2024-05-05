import isEqual from 'lodash/isEqual';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SortableItem } from '/@/renderer/store';
import { useSettingSearchContext } from '/@/renderer/features/settings/context/search-context';
import { SettingsOptions } from '/@/renderer/features/settings/components/settings-option';
import { Button } from '/@/renderer/components';
import { Reorder } from 'framer-motion';
import { Divider } from '@mantine/core';
import { DraggableItem } from '/@/renderer/features/settings/components/general/draggable-item';

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
    settings,
    setItems,
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
                description={descriptionText}
                title={titleText}
            />
            {open && (
                <Reorder.Group
                    axis="y"
                    values={localItems}
                    onReorder={setLocalItems}
                >
                    {localItems.map((item) => (
                        <DraggableItem
                            key={item.id}
                            handleChangeDisabled={handleChangeDisabled}
                            item={item}
                            value={translatedItemMap[item.id]}
                        />
                    ))}
                </Reorder.Group>
            )}
            <Divider />
        </>
    );
};
