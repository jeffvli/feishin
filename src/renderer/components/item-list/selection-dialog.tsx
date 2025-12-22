import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

import styles from './selection-dialog.module.css';

import i18n from '/@/i18n/i18n';
import {
    ItemListStateActions,
    useItemListStateSubscription,
} from '/@/renderer/components/item-list/helpers/item-list-state';
import { ContextMenuController } from '/@/renderer/features/context-menu/context-menu-controller';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { animationProps } from '/@/shared/components/animations/animation-props';
import { Group } from '/@/shared/components/group/group';
import { HoverCard } from '/@/shared/components/hover-card/hover-card';
import { Icon } from '/@/shared/components/icon/icon';
import { Kbd } from '/@/shared/components/kbd/kbd';
import { Table } from '/@/shared/components/table/table';
import { Text } from '/@/shared/components/text/text';

const controls = [
    {
        control1: <Kbd>CTRL</Kbd>,
        control2: <Kbd>A</Kbd>,
        label: i18n.t('action.selectAll', { postProcess: 'sentenceCase' }),
    },
    {
        control1: <Kbd>CTRL</Kbd>,
        control2: <Icon fill="default" icon="mouseLeftClick" />,
        label: i18n.t('action.addOrRemoveFromSelection', { postProcess: 'sentenceCase' }),
    },
    {
        control1: <Kbd>SHIFT</Kbd>,
        control2: <Icon fill="default" icon="mouseLeftClick" />,
        label: i18n.t('action.selectRangeOfItems', { postProcess: 'sentenceCase' }),
    },
];

export const SelectionDialog = ({ internalState }: { internalState: ItemListStateActions }) => {
    const { t } = useTranslation();

    const isListExpanded = useItemListStateSubscription(internalState, (state) =>
        state ? state.expanded.size > 0 : false,
    );

    const selectedCount = useItemListStateSubscription(internalState, (state) =>
        state ? state.selected.size : 0,
    );

    const handleClearSelection = () => {
        internalState.clearSelected();
    };

    const handleOpenMoreActions = (event: React.MouseEvent<unknown>) => {
        event.preventDefault();
        event.stopPropagation();

        const selectedItems = internalState.getSelected();

        if (selectedItems.length === 0) {
            return;
        }

        ContextMenuController.call({
            cmd: { items: selectedItems as any[], type: (selectedItems[0] as any)._itemType },
            event,
        });
    };

    const isOpen = selectedCount > 0;

    return (
        <AnimatePresence initial={false} mode="sync">
            {isOpen && (
                <motion.div
                    {...animationProps.fadeIn}
                    className={styles.selectionIndicator}
                    style={{ bottom: isListExpanded ? '320px' : '1rem' }}
                >
                    <Group gap="xl" justify="space-between">
                        <Group gap="sm">
                            <HoverCard offset={20} position="top">
                                <HoverCard.Target>
                                    <span className={styles.infoIcon}>
                                        <Icon icon="keyboard" />
                                    </span>
                                </HoverCard.Target>
                                <HoverCard.Dropdown>
                                    <Table>
                                        <Table.Tbody>
                                            {controls.map((control) => (
                                                <Table.Tr key={control.label}>
                                                    <Table.Td ta="start">
                                                        {control.control1}
                                                    </Table.Td>
                                                    <Table.Td>+</Table.Td>
                                                    <Table.Td ta="center">
                                                        {control.control2}
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Text size="xs">{control.label}</Text>
                                                    </Table.Td>
                                                </Table.Tr>
                                            ))}
                                        </Table.Tbody>
                                    </Table>
                                </HoverCard.Dropdown>
                            </HoverCard>
                            <Text fw={500} isNoSelect size="sm">
                                {t('common.countSelected', { count: selectedCount })}
                            </Text>
                        </Group>

                        <Group gap="xs">
                            <ActionIcon
                                icon="x"
                                iconProps={{ size: 'xl' }}
                                onClick={handleClearSelection}
                                size="xs"
                                variant="subtle"
                            />
                            <ActionIcon
                                icon="ellipsisHorizontal"
                                iconProps={{ size: 'xl' }}
                                onClick={handleOpenMoreActions}
                                size="xs"
                                variant="subtle"
                            />
                        </Group>
                    </Group>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
