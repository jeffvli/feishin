import { useState } from 'react';
import { Button, ConfirmModal, Switch, Text, Textarea } from '/@/renderer/components';
import { sanitizeCss } from '/@/renderer/utils/sanitize';
import { Code } from '@mantine/core';
import { SettingsOptions } from '/@/renderer/features/settings/components/settings-option';
import { closeAllModals, openModal } from '@mantine/modals';
import { useTranslation } from 'react-i18next';
import { useCssSettings, useSettingsStoreActions } from '/@/renderer/store';

export const StylesSettings = () => {
    const [open, setOpen] = useState(false);
    const { t } = useTranslation();

    const { enabled, content } = useCssSettings();
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
                                        compact
                                        // disabled={isSaveButtonDisabled}
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
