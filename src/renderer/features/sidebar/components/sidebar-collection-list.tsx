import clsx from 'clsx';
import { MouseEvent, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';

import styles from './sidebar-collection-list.module.css';

import { SidebarIcon } from '/@/renderer/features/sidebar/components/sidebar-icon';
import { AppRoute } from '/@/renderer/router/routes';
import { useCollections, useSettingsStoreActions } from '/@/renderer/store';
import { getFilterQueryStringFromSearchParams } from '/@/renderer/utils/query-params';
import { Accordion } from '/@/shared/components/accordion/accordion';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { Group } from '/@/shared/components/group/group';
import { Popover } from '/@/shared/components/popover/popover';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { useDisclosure } from '/@/shared/hooks/use-disclosure';
import { useForm } from '/@/shared/hooks/use-form';
import { LibraryItem, SavedCollection } from '/@/shared/types/domain-types';

export const getCollectionTo = (collection: SavedCollection) => {
    const pathname =
        collection.type === LibraryItem.ALBUM ? AppRoute.LIBRARY_ALBUMS : AppRoute.LIBRARY_SONGS;
    const search = collection.filterQueryString ? `?${collection.filterQueryString}` : '';
    return { pathname, search };
};

const CollectionRow = ({
    collection,
    onRename,
}: {
    collection: SavedCollection;
    onRename: (id: string, name: string) => void;
}) => {
    const { t } = useTranslation();
    const { removeCollection } = useSettingsStoreActions();
    const [isRenameOpen, renameHandlers] = useDisclosure(false);

    const form = useForm({
        initialValues: {
            name: collection.name,
        },
    });

    const location = useLocation();
    const to = getCollectionTo(collection);

    const currentFilterQuery = getFilterQueryStringFromSearchParams(
        new URLSearchParams(location.search),
    );
    const collectionFilterQuery = collection.filterQueryString ?? '';
    const isActive =
        location.pathname === to.pathname && currentFilterQuery === collectionFilterQuery;

    const handleRenameOpen = useCallback(
        (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            form.setValues({ name: collection.name });
            renameHandlers.open();
        },
        [collection.name, form, renameHandlers],
    );

    const handleRenameSubmit = form.onSubmit((values) => {
        const trimmed = values.name.trim();
        if (trimmed) {
            onRename(collection.id, trimmed);
            renameHandlers.close();
        }
    });

    const handleDelete = useCallback(
        (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            removeCollection(collection.id);
        },
        [collection.id, removeCollection],
    );

    return (
        <Popover
            onClose={renameHandlers.close}
            opened={isRenameOpen}
            position="right-start"
            width={280}
        >
            <Popover.Target>
                <div className={clsx(styles.row, { [styles.rowActive]: isActive })}>
                    <Link className={styles.rowLink} to={to}>
                        <Group className={styles.rowContent} wrap="nowrap">
                            <SidebarIcon
                                active={isActive}
                                route={
                                    collection.type === LibraryItem.ALBUM
                                        ? AppRoute.LIBRARY_ALBUMS
                                        : AppRoute.LIBRARY_SONGS
                                }
                                size="1rem"
                            />
                            <Text className={styles.name} fw={500} size="md">
                                {collection.name}
                            </Text>
                        </Group>
                        <DropdownMenu position="right-start" trigger="click">
                            <DropdownMenu.Target>
                                <ActionIcon
                                    className={styles.moreButton}
                                    icon="ellipsisVertical"
                                    iconProps={{ size: 'xs' }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    size="compact-sm"
                                    variant="transparent"
                                />
                            </DropdownMenu.Target>
                            <DropdownMenu.Dropdown>
                                <DropdownMenu.Item onClick={handleRenameOpen}>
                                    {t('common.rename', { postProcess: 'sentenceCase' })}
                                </DropdownMenu.Item>
                                <DropdownMenu.Item color="red" onClick={handleDelete}>
                                    {t('common.delete', { postProcess: 'sentenceCase' })}
                                </DropdownMenu.Item>
                            </DropdownMenu.Dropdown>
                        </DropdownMenu>
                    </Link>
                </div>
            </Popover.Target>
            <Popover.Dropdown>
                <form onSubmit={handleRenameSubmit}>
                    <Stack gap="md" p="xs">
                        <TextInput
                            autoFocus
                            maxLength={128}
                            variant="filled"
                            {...form.getInputProps('name')}
                        />
                        <Group gap="xs" justify="flex-end">
                            <Button onClick={renameHandlers.close} type="button" variant="subtle">
                                {t('common.cancel', { postProcess: 'sentenceCase' })}
                            </Button>
                            <Button type="submit" variant="filled">
                                {t('common.save', { postProcess: 'sentenceCase' })}
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Popover.Dropdown>
        </Popover>
    );
};

export const SidebarCollectionList = () => {
    const { t } = useTranslation();
    const collections = useCollections();
    const { updateCollection } = useSettingsStoreActions();

    const handleRename = useCallback(
        (id: string, name: string) => {
            updateCollection(id, { name });
        },
        [updateCollection],
    );

    if (!collections || collections.length === 0) {
        return null;
    }

    return (
        <Accordion.Item value="collections">
            <Accordion.Control component="div" role="button" style={{ userSelect: 'none' }}>
                <Text fw={500}>{t('page.sidebar.collections', { postProcess: 'titleCase' })}</Text>
            </Accordion.Control>
            <Accordion.Panel>
                {collections.map((collection) => (
                    <CollectionRow
                        collection={collection}
                        key={collection.id}
                        onRename={handleRename}
                    />
                ))}
            </Accordion.Panel>
        </Accordion.Item>
    );
};
