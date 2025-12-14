import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
    useRadioControls,
    useRadioPlayer,
} from '/@/renderer/features/radio/hooks/use-radio-player';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Group } from '/@/shared/components/group/group';
import { Table } from '/@/shared/components/table/table';
import { Text } from '/@/shared/components/text/text';
import { InternetRadioStation } from '/@/shared/types/domain-types';

interface RadioListTableProps {
    data: InternetRadioStation[];
}

export const RadioListTable = ({ data }: RadioListTableProps) => {
    const { t } = useTranslation();
    const { currentStreamUrl, isPlaying, metadata } = useRadioPlayer();
    const { pause, play } = useRadioControls();

    const rows = useMemo(
        () =>
            data.map((station) => {
                const isCurrentStation = currentStreamUrl === station.streamUrl;
                const stationIsPlaying = isCurrentStation && isPlaying;

                return {
                    actions: (
                        <Group gap="xs">
                            {stationIsPlaying ? (
                                <ActionIcon
                                    icon="mediaPause"
                                    onClick={() => pause()}
                                    size="sm"
                                    variant="subtle"
                                />
                            ) : (
                                <ActionIcon
                                    icon="mediaPlay"
                                    onClick={() => play(station.streamUrl, station.name)}
                                    size="sm"
                                    variant="subtle"
                                />
                            )}
                        </Group>
                    ),
                    homepageUrl: station.homepageUrl ? (
                        <a href={station.homepageUrl} rel="noreferrer" target="_blank">
                            {station.homepageUrl}
                        </a>
                    ) : (
                        <Text c="dimmed">—</Text>
                    ),
                    name: (
                        <Group gap="xs">
                            <Text>{station.name}</Text>
                            {isCurrentStation && metadata && (
                                <Text c="dimmed" size="sm">
                                    {metadata}
                                </Text>
                            )}
                        </Group>
                    ),
                    streamUrl: <Text c="dimmed">{station.streamUrl}</Text>,
                };
            }),
        [currentStreamUrl, data, isPlaying, metadata, pause, play],
    );

    return (
        <Table highlightOnHover striped>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>{t('table.column.name', { postProcess: 'upperCase' })}</Table.Th>
                    <Table.Th>{t('table.column.streamUrl', { postProcess: 'upperCase' })}</Table.Th>
                    <Table.Th>
                        {t('table.column.homepageUrl', { postProcess: 'upperCase' })}
                    </Table.Th>
                    <Table.Th style={{ width: 100 }}></Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {rows.map((row, index) => (
                    <Table.Tr key={data[index].id}>
                        <Table.Td>{row.name}</Table.Td>
                        <Table.Td>{row.streamUrl}</Table.Td>
                        <Table.Td>{row.homepageUrl}</Table.Td>
                        <Table.Td>{row.actions}</Table.Td>
                    </Table.Tr>
                ))}
            </Table.Tbody>
        </Table>
    );
};
