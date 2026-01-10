import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import i18n from '/@/i18n/i18n';
import { SettingsOptions } from '/@/renderer/features/settings/components/settings-option';
import { useGeneralSettings, useSettingsStoreActions } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Table } from '/@/shared/components/table/table';
import { Text } from '/@/shared/components/text/text';

const options = [
    {
        label: i18n.t('setting.imageResolution_optionTable', { postProcess: 'sentenceCase' }),
        value: 'table',
    },
    {
        label: i18n.t('setting.imageResolution_optionItemCard', { postProcess: 'sentenceCase' }),
        value: 'itemCard',
    },
    {
        label: i18n.t('setting.imageResolution_optionSidebar', { postProcess: 'sentenceCase' }),
        value: 'sidebar',
    },
    {
        label: i18n.t('setting.imageResolution_optionHeader', { postProcess: 'sentenceCase' }),
        value: 'header',
    },
    {
        label: i18n.t('setting.imageResolution_optionFullScreenPlayer', {
            postProcess: 'sentenceCase',
        }),
        value: 'fullScreenPlayer',
    },
];

export const ImageResolutionSettings = memo(() => {
    const { t } = useTranslation();
    const { setSettings } = useSettingsStoreActions();
    const settings = useGeneralSettings();

    const [open, setOpen] = useState(false);

    const descriptionText = t('setting.imageResolution', {
        context: 'description',
        postProcess: 'sentenceCase',
    });

    const titleText = t('setting.imageResolution', { postProcess: 'sentenceCase' });

    return (
        <>
            <SettingsOptions
                control={
                    <>
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
                <Table withRowBorders={false}>
                    <Table.Tbody>
                        {options.map((option) => (
                            <Table.Tr key={option.value}>
                                <Table.Th key={option.value}>
                                    <Text>{option.label}</Text>
                                </Table.Th>
                                <Table.Td align="right" key={option.value}>
                                    <NumberInput
                                        max={2000}
                                        min={0}
                                        onChange={(e) => {
                                            if (!e) return;

                                            if (typeof e === 'string') return;

                                            setSettings({
                                                general: {
                                                    ...settings,
                                                    imageRes: {
                                                        ...settings.imageRes,
                                                        [option.value]: e,
                                                    },
                                                },
                                            });
                                        }}
                                        rightSection={
                                            <Text isMuted isNoSelect pr="lg" size="sm">
                                                px
                                            </Text>
                                        }
                                        value={settings.imageRes[option.value]}
                                        width={90}
                                    />
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            )}
        </>
    );
});
