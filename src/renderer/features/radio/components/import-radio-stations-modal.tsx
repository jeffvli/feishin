import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { queryKeys } from '/@/renderer/api/query-keys';
import {
    importRadioStations,
    isSameServer,
    RadioStationsFile,
    RadioStationsFileSchema,
} from '/@/renderer/features/radio/utils/radio-export';
import { useCurrentServer } from '/@/renderer/store';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { DragDropZone } from '/@/shared/components/drag-drop-zone/drag-drop-zone';
import { Group } from '/@/shared/components/group/group';
import { closeAllModals } from '/@/shared/components/modal/modal';
import { ModalButton } from '/@/shared/components/modal/model-shared';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';

const parseFile = (contents: string): null | RadioStationsFile => {
    try {
        const result = RadioStationsFileSchema.safeParse(JSON.parse(contents));
        return result.success ? result.data : null;
    } catch {
        return null;
    }
};

export const ImportRadioStationsModal = () => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const queryClient = useQueryClient();

    const [file, setFile] = useState<null | RadioStationsFile>(null);
    const [selected, setSelected] = useState<number[]>([]);
    const [isImporting, setIsImporting] = useState(false);

    const validateItem = useCallback(
        (contents: string) =>
            parseFile(contents)
                ? { isValid: true }
                : { error: t('form.importRadioStations.error_invalidFile'), isValid: false },
        [t],
    );

    const onItemSelected = useCallback(
        (contents: string) => {
            const parsed = parseFile(contents);
            if (!parsed) return;

            // Pre-select the stations exported from this server, if the file has any.
            // Otherwise the user is moving stations between servers, so select everything.
            const matching = parsed.radioStations.flatMap((entry, index) =>
                server && isSameServer(entry.server, server) ? [index] : [],
            );

            setFile(parsed);
            setSelected(
                matching.length > 0 ? matching : parsed.radioStations.map((_, index) => index),
            );
        },
        [server],
    );

    const toggle = (index: number) => {
        setSelected((prev) =>
            prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
        );
    };

    const handleImport = async () => {
        if (!server || !file) return;

        setIsImporting(true);

        const stations = selected.flatMap((index) => file.radioStations[index].stations);
        const result = await importRadioStations(server, stations);

        await queryClient.invalidateQueries({
            exact: false,
            queryKey: queryKeys.radio.list(server.id),
        });

        setIsImporting(false);
        closeAllModals();

        const message = t('form.importRadioStations.result', {
            added: result.added,
            skipped: result.skipped,
        });

        if (result.failed > 0) {
            toast.warn({
                message: `${message} ${t('form.importRadioStations.result_failed', { failed: result.failed })}`,
            });
        } else {
            toast.success({ message });
        }
    };

    if (!file) {
        return (
            <Stack gap="md">
                <Text isMuted size="sm">
                    {t('form.importRadioStations.description', { server: server?.name })}
                </Text>
                <DragDropZone
                    icon="fileJson"
                    onItemSelected={onItemSelected}
                    validateItem={validateItem}
                />
            </Stack>
        );
    }

    if (file.radioStations.length === 0) {
        return (
            <Stack gap="md">
                <Text>{t('form.importRadioStations.empty')}</Text>
                <Group justify="flex-end">
                    <ModalButton onClick={() => closeAllModals()} variant="subtle">
                        {t('common.close')}
                    </ModalButton>
                </Group>
            </Stack>
        );
    }

    return (
        <Stack gap="md">
            <Text isMuted size="sm">
                {t('form.importRadioStations.selectSources', { server: server?.name })}
            </Text>
            <Stack gap="sm">
                {file.radioStations.map((entry, index) => (
                    <Checkbox
                        checked={selected.includes(index)}
                        description={`${entry.server.url} - ${t('entity.radioStationWithCount', { count: entry.stations.length })}`}
                        key={`${entry.server.type}-${entry.server.url}-${index}`}
                        label={`${entry.server.name} (${entry.server.type})`}
                        onChange={() => toggle(index)}
                    />
                ))}
            </Stack>
            <Group justify="flex-end">
                <ModalButton onClick={() => closeAllModals()} variant="subtle">
                    {t('common.cancel')}
                </ModalButton>
                <ModalButton
                    disabled={selected.length === 0}
                    loading={isImporting}
                    onClick={handleImport}
                    variant="filled"
                >
                    {t('form.importRadioStations.submit')}
                </ModalButton>
            </Group>
        </Stack>
    );
};
