import { closeAllModals, openModal } from '@mantine/modals';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SettingsOptions } from '/@/renderer/features/settings/components/settings-option';
import { useCssSettings, useSettingsStoreActions } from '/@/renderer/store';
import { sanitizeCss } from '/@/renderer/utils/sanitize';
import { Button } from '/@/shared/components/button/button';
import { Code } from '/@/shared/components/code/code';
import { ConfirmModal } from '/@/shared/components/modal/modal';
import { Switch } from '/@/shared/components/switch/switch';
import { Text } from '/@/shared/components/text/text';
import { Textarea } from '/@/shared/components/textarea/textarea';

export const StylesSettings = () => {
    const [open, setOpen] = useState(false);
    const { t } = useTranslation();

    const { content, enabled } = useCssSettings();
    const [css, setCss] = useState(content);

    const { setSettings } = useSettingsStoreActions();

    const handleSave = () => {
        setSettings({
            css: {
                content: css,
                enabled,
            },
        });
    };

    const handleResetToDefault = () => {
        setSettings({
            css: {
                content,
                enabled: true,
            },
        });
        closeAllModals();
    };

    const openConfirmModal = () => {
        openModal({
            children: (
                <ConfirmModal onConfirm={handleResetToDefault}>
                    <Text color="red !important">
                        {t('setting.customCssNotice', { postProcess: 'sentenceCase' })}
                    </Text>
                </ConfirmModal>
            ),
            title: t('setting.customCssEnable', { postProcess: 'sentenceCase' }),
        });
    };

    return (
        <>
            <SettingsOptions
                control={
                    <Switch
                        checked={enabled}
                        onChange={(e) => {
                            if (!e.currentTarget.checked) {
                                setSettings({
                                    css: {
                                        content,
                                        enabled: false,
                                    },
                                });
                            } else {
                                openConfirmModal();
                            }
                        }}
                    />
                }
                description={t('setting.customCssEnable', {
                    context: 'description',
                    postProcess: 'sentenceCase',
                })}
                title={t('setting.customCssEnable', { postProcess: 'sentenceCase' })}
            />
            {enabled && (
                <>
                    <SettingsOptions
                        control={
                            <>
                                {open && (
                                    <Button
                                        onClick={handleSave}
                                        size="compact-md"
                                        // disabled={isSaveButtonDisabled}
                                        variant="filled"
                                    >
                                        {t('common.save', { postProcess: 'titleCase' })}
                                    </Button>
                                )}
                                <Button
                                    onClick={() => setOpen(!open)}
                                    size="compact-md"
                                    variant="filled"
                                >
                                    {t(open ? 'common.close' : 'common.edit', {
                                        postProcess: 'titleCase',
                                    })}
                                </Button>
                            </>
                        }
                        description={t('setting.customCss', {
                            context: 'description',
                            postProcess: 'sentenceCase',
                        })}
                        title={t('setting.customCss', { postProcess: 'sentenceCase' })}
                    />
                    {open && (
                        <>
                            <Textarea
                                autosize
                                defaultValue={css}
                                onBlur={(e) =>
                                    setCss(sanitizeCss(`<style>${e.currentTarget.value}`))
                                }
                            />
                            <Text>{t('common.preview', { postProcess: 'sentenceCase' })}: </Text>
                            <Code block>{css}</Code>
                        </>
                    )}
                </>
            )}
        </>
    );
};
