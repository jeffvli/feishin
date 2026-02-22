import { nanoid } from 'nanoid';
import { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import styles from './save-as-collection-button.module.css';

import { useListContext } from '/@/renderer/context/list-context';
import { useCollections, useSettingsStoreActions } from '/@/renderer/store';
import { getFilterQueryStringFromSearchParams } from '/@/renderer/utils/query-params';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { Popover } from '/@/shared/components/popover/popover';
import { ScrollArea } from '/@/shared/components/scroll-area/scroll-area';
import { Stack } from '/@/shared/components/stack/stack';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { Text } from '/@/shared/components/text/text';
import { useDisclosure } from '/@/shared/hooks/use-disclosure';
import { useForm } from '/@/shared/hooks/use-form';
import { LibraryItem, SavedCollection } from '/@/shared/types/domain-types';

interface SaveAsCollectionButtonProps {
    fullWidth?: boolean;
    itemType: LibraryItem.ALBUM | LibraryItem.SONG;
}

export const SaveAsCollectionButton = ({ fullWidth, itemType }: SaveAsCollectionButtonProps) => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const { customFilters } = useListContext();
    const collections = useCollections();
    const { addCollection, updateCollection } = useSettingsStoreActions();
    const [isOpen, handlers] = useDisclosure(false);
    const formRef = useRef<HTMLFormElement>(null);

    const sameTypeCollections = useMemo(
        () => collections?.filter((c): c is SavedCollection => c.type === itemType) ?? [],
        [collections, itemType],
    );

    const form = useForm({
        initialValues: {
            name: '',
        },
    });

    const handleOpen = useCallback(() => {
        form.setValues({ name: '' });
        handlers.open();
    }, [form, handlers]);

    const handleOverrideExisting = useCallback(
        (collection: SavedCollection) => {
            const filterQueryString = getFilterQueryStringFromSearchParams(
                searchParams,
                customFilters as Record<
                    string,
                    boolean | number | Record<string, unknown> | string | string[]
                >,
            );
            updateCollection(collection.id, { filterQueryString });
            handlers.close();
        },
        [customFilters, handlers, searchParams, updateCollection],
    );

    const handleSubmit = form.onSubmit((values) => {
        const trimmed = values.name.trim();
        if (!trimmed) return;

        const filterQueryString = getFilterQueryStringFromSearchParams(
            searchParams,
            customFilters as Record<
                string,
                boolean | number | Record<string, unknown> | string | string[]
            >,
        );

        addCollection({
            filterQueryString,
            id: nanoid(),
            name: trimmed,
            type: itemType,
        });
        handlers.close();
    });

    const handleFormKeyDown = useCallback((e: React.KeyboardEvent<HTMLFormElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            formRef.current?.requestSubmit();
        }
    }, []);

    return (
        <Popover onClose={handlers.close} opened={isOpen} width="target">
            <Popover.Target>
                {fullWidth ? (
                    <Button fullWidth onClick={handleOpen} variant="default">
                        {t('page.collections.saveAsCollection', {
                            postProcess: 'sentenceCase',
                        })}
                    </Button>
                ) : (
                    <ActionIcon
                        icon="folder"
                        iconProps={{ size: 'lg' }}
                        onClick={handleOpen}
                        tooltip={{
                            label: t('page.collections.saveAsCollection', {
                                postProcess: 'sentenceCase',
                            }),
                        }}
                        variant="subtle"
                    />
                )}
            </Popover.Target>
            <Popover.Dropdown>
                <form onKeyDown={handleFormKeyDown} onSubmit={handleSubmit} ref={formRef}>
                    <Stack gap="sm">
                        <Text fw={500} size="sm" ta="center">
                            {t('page.collections.overrideExisting', {
                                postProcess: 'sentenceCase',
                            })}
                        </Text>
                        <div className={styles.list}>
                            <ScrollArea>
                                <Stack gap={0}>
                                    {sameTypeCollections.map((collection) => (
                                        <Button
                                            className={styles.row}
                                            key={collection.id}
                                            onClick={() => handleOverrideExisting(collection)}
                                            type="button"
                                            variant="subtle"
                                        >
                                            <Text className={styles['row-name']} size="sm">
                                                {collection.name}
                                            </Text>
                                        </Button>
                                    ))}
                                </Stack>
                            </ScrollArea>
                        </div>
                        <TextInput autoFocus maxLength={128} {...form.getInputProps('name')} />
                        <Group gap="xs" justify="flex-end">
                            <Button onClick={handlers.close} type="button" variant="subtle">
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
