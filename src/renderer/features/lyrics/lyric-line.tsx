import clsx from 'clsx';
import { ComponentPropsWithoutRef, memo, useMemo } from 'react';

import styles from './lyric-line.module.css';

import { sanitize } from '/@/renderer/utils/sanitize';
import { Box } from '/@/shared/components/box/box';
import { Stack } from '/@/shared/components/stack/stack';

interface LyricLineProps extends ComponentPropsWithoutRef<'div'> {
    alignment: 'center' | 'left' | 'right';
    fontSize: number;
    romajiText?: null | string;
    text?: string;
    translatedText?: null | string;
}

export const LyricLine = memo(
    ({
        alignment,
        className,
        fontSize,
        romajiText,
        text,
        translatedText,
        ...props
    }: LyricLineProps) => {
        const lines = useMemo(() => (text ?? '').split('_BREAK_'), [text]);

        const style = useMemo(
            () => ({
                fontSize,
                textAlign: alignment,
            }),
            [fontSize, alignment],
        );

        return (
            <Box className={clsx(styles.lyricLine, className)} style={style} {...props}>
                <Stack gap={0}>
                    {lines.map((line, index) => (
                        <span dangerouslySetInnerHTML={{ __html: sanitize(line) }} key={index} />
                    ))}
                    {romajiText && (
                        <span
                            className={styles.romajiLine}
                            dangerouslySetInnerHTML={{ __html: sanitize(romajiText) }}
                        />
                    )}
                    {translatedText && (
                        <span dangerouslySetInnerHTML={{ __html: sanitize(translatedText) }} />
                    )}
                </Stack>
            </Box>
        );
    },
);

LyricLine.displayName = 'LyricLine';
