import isElectron from 'is-electron';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SettingsOptions } from '/@/renderer/features/settings/components/settings-option';
import { useCssSettings, useSettingsStoreActions } from '/@/renderer/store';
import { sanitizeCss } from '/@/renderer/utils/sanitize';
import { Button } from '/@/shared/components/button/button';
import { Code } from '/@/shared/components/code/code';
import { Switch } from '/@/shared/components/switch/switch';
import { Text } from '/@/shared/components/text/text';
import { Textarea } from '/@/shared/components/textarea/textarea';

export const StylesSettings = memo(() => {
    const [open, setOpen] = useState(false);
    const { t } = useTranslation();

    const utils = isElectron() ? window.api.utils : null;
    const isDesktop = isElectron();

    const { content, enabled } = useCssSettings();
    const [css, setCss] = useState(content);

    const { setSettings } = useSettingsStoreActions();

    const handleSave = async () => {
        setSettings({
            css: {
                content: css,
                enabled,
            },
        });

        if (utils) {
            try {
                await utils.saveCustomCss(css);
            } catch (error) {
                console.error('Failed to save custom css file', error);
            }
        }
    };

    const handleOpenFolder = async () => {
        if (!utils) return;

        try {
            await utils.openCustomCssFolder();
        } catch (error) {
            console.error('Failed to open custom css folder', error);
        }
    };

    useEffect(() => {
        if (content !== css) {
            setCss(content);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- Reason: This is to only fire if an external source updates the stores css.content
    }, [content]);

    return (
        <>
            <SettingsOptions
                control={
                    <Switch
                        checked={enabled}
                        onChange={(e) => {
                            setSettings({
                                css: {
                                    content,
                                    enabled: e.currentTarget.checked,
                                },
                            });
                        }}
                    />
                }
                description={t('setting.customCssEnable', {
                    context: 'description',
                })}
                note={t('setting.customCssNotice')}
                title={t('setting.customCssEnable')}
            />
            {enabled && (
                <>
                    <SettingsOptions
                        control={
                            <>
                                {isDesktop && (
                                    <Button
                                        onClick={handleOpenFolder}
                                        size="compact-md"
                                        variant="subtle"
                                    >
                                        {t('common.openFolder', { postProcess: 'titleCase' })}
                                    </Button>
                                )}
                                {open && (
                                    <Button
                                        onClick={handleSave}
                                        size="compact-md"
                                        // disabled={isSaveButtonDisabled}
                                        variant="filled"
                                    >
                                        {t('common.save')}
                                    </Button>
                                )}
                                <Button
                                    onClick={() => setOpen(!open)}
                                    size="compact-md"
                                    variant="filled"
                                >
                                    {t(open ? 'common.close' : 'common.edit', {})}
                                </Button>
                            </>
                        }
                        description={t('setting.customCss', {
                            context: 'description',
                        })}
                        title={t('setting.customCss')}
                    />
                    {open && (
                        <>
                            <Textarea
                                autosize
                                defaultValue={css}
                                minRows={8}
                                onBlur={(e) =>
                                    setCss(sanitizeCss(`<style>${e.currentTarget.value}`))
                                }
                            />
                            <Text>{t('common.preview')}: </Text>
                            <Code block>{css}</Code>
                        </>
                    )}
                </>
            )}
        </>
    );
});
