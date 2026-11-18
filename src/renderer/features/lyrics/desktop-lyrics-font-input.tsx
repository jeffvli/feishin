import type { DesktopLyricsFont } from '/@/shared/types/desktop-lyrics';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { type Font, FONT_OPTIONS } from '/@/renderer/types/fonts';
import { logger } from '/@/renderer/utils/logger';
import { FileInput } from '/@/shared/components/file-input/file-input';
import { Select } from '/@/shared/components/select/select';
import { Stack } from '/@/shared/components/stack/stack';
import { toast } from '/@/shared/components/toast/toast';

// Match application settings: built-in fonts, Local Font Access and native file selection.
export const DesktopLyricsFontInput = ({
    disabled,
    label,
    onChange,
    value,
    width,
}: {
    disabled: boolean;
    label: string;
    onChange: (value: DesktopLyricsFont) => void;
    value: DesktopLyricsFont;
    width: number | string;
}) => {
    const { t } = useTranslation();
    const [fonts, setFonts] = useState<Font[]>([]);
    useEffect(() => {
        if (value.type !== 'system' || !window.queryLocalFonts) return;
        let active = true;
        void window
            .queryLocalFonts()
            .then((data) => {
                if (active)
                    setFonts(
                        data.map((font) => ({ label: font.fullName, value: font.postscriptName })),
                    );
            })
            .catch((error: unknown) => {
                if (!active) return;
                logger.error('Failed to list desktop lyrics system fonts', { error });
                toast.error({ message: t('error.systemFontError') });
            });
        return () => {
            active = false;
        };
    }, [t, value.type]);
    return (
        <Stack gap="xs" w={width}>
            <Select
                aria-label={`${label} - ${t('setting.fontType')}`}
                data={['builtIn', ...(window.queryLocalFonts ? ['system'] : []), 'custom'].map(
                    (type) => ({
                        label: t('setting.fontType', {
                            context: `option${type[0].toUpperCase()}${type.slice(1)}`,
                        }),
                        value: type,
                    }),
                )}
                disabled={disabled}
                onChange={(type) => {
                    if (type) onChange({ ...value, type: type as DesktopLyricsFont['type'] });
                }}
                value={value.type}
            />
            {value.type === 'builtIn' && (
                <Select
                    aria-label={label}
                    data={[
                        ...FONT_OPTIONS,
                        ...(!FONT_OPTIONS.some((font) => font.value === value.builtIn)
                            ? [{ label: value.builtIn, value: value.builtIn }]
                            : []),
                    ]}
                    disabled={disabled}
                    onChange={(builtIn) => {
                        if (builtIn)
                            onChange({
                                ...value,
                                builtIn: builtIn as DesktopLyricsFont['builtIn'],
                            });
                    }}
                    searchable
                    value={value.builtIn}
                />
            )}
            {value.type === 'system' && (
                <Select
                    aria-label={label}
                    data={[
                        ...fonts,
                        ...(value.system && !fonts.some((font) => font.value === value.system)
                            ? [{ label: value.system, value: value.system }]
                            : []),
                    ]}
                    disabled={disabled}
                    onChange={(system) => onChange({ ...value, system })}
                    searchable
                    value={value.system}
                />
            )}
            {value.type === 'custom' && (
                <FileInput
                    accept=".ttc,.ttf,.otf,.woff,.woff2"
                    aria-label={label}
                    clearable
                    disabled={disabled}
                    onChange={(file) =>
                        onChange({
                            ...value,
                            custom: file ? window.api.getPathForFile(file) : null,
                        })
                    }
                    onClick={() => {
                        void window.api.desktopLyrics
                            .selectFont()
                            .then((custom) => {
                                if (custom) onChange({ ...value, custom });
                            })
                            .catch((error: unknown) => {
                                logger.error('Failed to select desktop lyrics font', { error });
                                toast.error({ message: t('desktopLyrics.error') });
                            });
                    }}
                    value={value.custom ? new File([], value.custom.split(/[\\/]/).pop()!) : null}
                />
            )}
        </Stack>
    );
};
