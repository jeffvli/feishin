import { useMemo } from 'react';

import { GridConfig } from '/@/renderer/features/shared/components/grid-config';
import {
    DISPLAY_TYPES,
    ListConfigMenuFormProps,
    ListConfigTable,
} from '/@/renderer/features/shared/components/list-config-menu';
import { TableConfig } from '/@/renderer/features/shared/components/table-config';
import { useSettingsStore, useSettingsStoreActions } from '/@/renderer/store';
import { Fieldset } from '/@/shared/components/fieldset/fieldset';
import { SegmentedControl } from '/@/shared/components/segmented-control/segmented-control';
import { Stack } from '/@/shared/components/stack/stack';
import { ListDisplayType } from '/@/shared/types/types';

export const ListConfigSettingsForm = (props: ListConfigMenuFormProps) => {
    const displayType = useSettingsStore(
        (state) => state.lists[props.listKey]?.display,
    ) as ListDisplayType;
    const { setList } = useSettingsStoreActions();

    // Filter display types based on config
    const availableDisplayTypes = useMemo(() => {
        if (!props.displayTypes) {
            return DISPLAY_TYPES;
        }

        const filtered = DISPLAY_TYPES.map((type) => {
            const config = props.displayTypes?.find((c) => c.value === type.value);
            if (config?.hidden) {
                return null;
            }
            const result: (typeof DISPLAY_TYPES)[0] & { disabled?: boolean } = {
                ...type,
            };
            if (config?.disabled) {
                result.disabled = true;
            }
            return result;
        }).filter((type): type is NonNullable<typeof type> => type !== null);

        return filtered;
    }, [props.displayTypes]);

    const displayTypeSelector =
        availableDisplayTypes.length > 1 ? (
            <ListConfigTable
                options={[
                    {
                        component: (
                            <SegmentedControl
                                data={availableDisplayTypes}
                                fullWidth
                                onChange={(value) => {
                                    setList(props.listKey, {
                                        display: value as ListDisplayType,
                                    });
                                }}
                                size="sm"
                                value={displayType}
                                withItemsBorders={false}
                            />
                        ),
                        id: 'displayType',
                    },
                ]}
            />
        ) : null;

    return (
        <Config displayType={displayType} displayTypeSelector={displayTypeSelector} {...props} />
    );
};

const Config = ({
    displayType,
    displayTypeSelector,
    optionsConfig,
    tableColumnsData,
    ...props
}: ListConfigMenuFormProps & {
    displayType: ListDisplayType;
    displayTypeSelector: React.ReactNode;
}) => {
    let general: React.ReactNode = null;
    let columns: React.ReactNode = null;

    switch (displayType) {
        case ListDisplayType.DETAIL:
            if (props.detailConfig) {
                general = (
                    <TableConfig
                        enablePinColumnButtons={false}
                        listKey={props.listKey}
                        optionsConfig={props.detailConfig.optionsConfig}
                        section="general"
                        tableColumnsData={props.detailConfig.tableColumnsData}
                        tableKey="detail"
                    />
                );
                columns = (
                    <TableConfig
                        enablePinColumnButtons={false}
                        listKey={props.listKey}
                        optionsConfig={props.detailConfig.optionsConfig}
                        section="columns"
                        tableColumnsData={props.detailConfig.tableColumnsData}
                        tableKey="detail"
                    />
                );
            }
            break;

        case ListDisplayType.GRID:
            general = (
                <GridConfig
                    {...props}
                    gridRowsData={tableColumnsData}
                    optionsConfig={optionsConfig?.grid}
                    section="general"
                />
            );
            columns = (
                <GridConfig
                    {...props}
                    gridRowsData={tableColumnsData}
                    optionsConfig={optionsConfig?.grid}
                    section="columns"
                />
            );
            break;

        case ListDisplayType.TABLE:
            general = (
                <TableConfig
                    {...props}
                    optionsConfig={optionsConfig?.table}
                    section="general"
                    tableColumnsData={tableColumnsData}
                />
            );
            columns = (
                <TableConfig
                    {...props}
                    optionsConfig={optionsConfig?.table}
                    section="columns"
                    tableColumnsData={tableColumnsData}
                />
            );
            break;

        default:
            break;
    }

    return (
        <Stack gap="sm">
            {(displayTypeSelector || general) && (
                <Fieldset p="md">
                    <Stack>
                        {displayTypeSelector}
                        {general}
                    </Stack>
                </Fieldset>
            )}
            {columns && <Fieldset p="md">{columns}</Fieldset>}
        </Stack>
    );
};
