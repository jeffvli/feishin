import clsx from 'clsx';
import { ComponentPropsWithoutRef, memo, useMemo } from 'react';

import styles from './karaoke-lyric-line.module.css';

import { testRtl } from '/@/renderer/features/lyrics/api/lyrics-rtl';
import { splitWordCues } from '/@/renderer/features/lyrics/api/split-word-cue';
import { sanitize } from '/@/renderer/utils/sanitize';
import { Box } from '/@/shared/components/box/box';
import { Stack } from '/@/shared/components/stack/stack';
import { LyricAgent, SyncedCueLine } from '/@/shared/types/domain-types';

const LONG_WORD_THRESHOLD_MS = 1500;
const FURIGANA_HTML_RE = /<ruby[\s>]/i;

const hasFuriganaHtml = (text: string): boolean => FURIGANA_HTML_RE.test(text);

interface KaraokeLyricLineProps extends ComponentPropsWithoutRef<'div'> {
    agents?: LyricAgent[];
    alignment: 'center' | 'left' | 'right';
    cueLines: SyncedCueLine[];
    extraOverlays?: Array<{
        cueLines: null | SyncedCueLine[];
        text?: null | string;
    }>;
    fontSize: number;
    lineIndex: number;
    pronunciationCueLines?: null | SyncedCueLine[];
    pronunciationText?: null | string;
    romajiCueLines?: (null | SyncedCueLine)[] | null;
    romajiText?: null | string;
    text?: string;
    translatedText?: null | string;
    translationCueLines?: null | SyncedCueLine[];
}

type WordSpanVariant = 'main' | 'overlay-generic' | 'overlay-pronunciation' | 'overlay-translation';

const getWordSpanClasses = (
    variant: WordSpanVariant,
    options: {
        hasFurigana: boolean;
        isBackground: boolean;
        isRtl: boolean;
        isZeroDuration: boolean;
    },
) => {
    const isOverlay = variant !== 'main';

    return clsx(
        styles.karaokeWord,
        'karaoke-word',
        isOverlay && 'karaoke-overlay-word',
        variant === 'overlay-generic' && 'karaoke-overlay-generic',
        variant === 'overlay-pronunciation' && 'karaoke-overlay-pronunciation',
        variant === 'overlay-translation' && 'karaoke-overlay-translation',
        options.isRtl && 'karaoke-rtl',
        options.isBackground && 'karaoke-bg-vocal',
        options.isZeroDuration && 'karaoke-zero-dur',
        options.hasFurigana && 'karaoke-furigana-word',
    );
};

const getWordSpanIdPrefix = (variant: WordSpanVariant): string => {
    switch (variant) {
        case 'overlay-generic':
            return 'karaoke-overlay-generic';
        case 'overlay-pronunciation':
            return 'karaoke-overlay-pronunciation';
        case 'overlay-translation':
            return 'karaoke-overlay-translation';
        default:
            return 'karaoke';
    }
};

const renderWordSpans = (
    cueLine: SyncedCueLine,
    lineIndex: number,
    cueLineIndex: number,
    isBackground: boolean,
    variant: WordSpanVariant = 'main',
) => {
    const isOverlay = variant !== 'main';
    const idPrefix = getWordSpanIdPrefix(variant);

    if (!cueLine.words.length) {
        return (
            <span
                className={getWordSpanClasses(variant, {
                    hasFurigana: false,
                    isBackground,
                    isRtl: false,
                    isZeroDuration: false,
                })}
                dangerouslySetInnerHTML={{ __html: sanitize(cueLine.value) }}
                data-lyric-time={cueLine.startMs}
            />
        );
    }

    const splitWords =
        isOverlay || cueLine.words.some((word) => hasFuriganaHtml(word.text))
            ? cueLine.words
            : splitWordCues(cueLine.words);
    let wordCounter = 0;

    return splitWords.map((word) => {
        const durationMs = word.endMs - word.startMs;
        const durationSec = durationMs / 1000;
        const timeSec = word.startMs / 1000;
        const isRtl = testRtl(word.text);
        const isZeroDuration = durationMs <= 0;
        const hasFurigana = !isOverlay && hasFuriganaHtml(word.text);
        const sanitizedHtml = sanitize(word.text);
        const currentWordIndex = wordCounter;
        wordCounter += 1;

        const wordClassName = getWordSpanClasses(variant, {
            hasFurigana,
            isBackground,
            isRtl,
            isZeroDuration,
        });

        const wordKey = `${word.startMs}-${currentWordIndex}`;
        const wordProps = {
            className: wordClassName,
            'data-duration': String(durationSec),
            'data-lyric-time': cueLine.startMs,
            'data-time': String(timeSec),
            'data-word-start': word.startMs,
            id: `${idPrefix}-${lineIndex}-cue-${cueLineIndex}-word-${currentWordIndex}`,
            style: {
                '--karaoke-duration': `${durationMs}ms`,
            } as React.CSSProperties,
            ...(durationMs > LONG_WORD_THRESHOLD_MS ? { 'data-long-word': true as const } : {}),
        };

        return (
            <span key={wordKey} {...wordProps}>
                <span
                    className="karaoke-word-text"
                    dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                />
                <span
                    aria-hidden
                    className="karaoke-word-highlight"
                    dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                />
            </span>
        );
    });
};

const renderOverlayCueLineRow = (
    cueLine: SyncedCueLine,
    lineIndex: number,
    cueLineIndex: number,
    variant: 'overlay-generic' | 'overlay-pronunciation' | 'overlay-translation',
    lineClassName: string,
) => (
    <span className={lineClassName}>
        {renderWordSpans(cueLine, lineIndex, cueLineIndex, false, variant)}
    </span>
);

const hasSyncedOverlayCueLines = (cueLines: null | SyncedCueLine[] | undefined): boolean =>
    !!cueLines?.some((cueLine) => cueLine.words.length > 0);

export const KaraokeLyricLine = memo(
    ({
        agents,
        alignment,
        className,
        cueLines,
        extraOverlays,
        fontSize,
        lineIndex,
        pronunciationCueLines,
        pronunciationText,
        romajiCueLines,
        romajiText,
        translatedText,
        translationCueLines,
        ...props
    }: KaraokeLyricLineProps) => {
        const style = useMemo(
            () => ({
                fontSize,
                textAlign: alignment,
            }),
            [fontSize, alignment],
        );

        const hasSyncedRomajiOverlay = romajiCueLines !== undefined;
        const hasSyncedPronunciation = hasSyncedOverlayCueLines(pronunciationCueLines);
        const hasSyncedTranslation = hasSyncedOverlayCueLines(translationCueLines);
        const pronunciationFallbackText =
            !hasSyncedRomajiOverlay && !hasSyncedPronunciation
                ? (pronunciationText ?? romajiText)
                : null;

        return (
            <Box
                className={clsx(styles.karaokeLine, 'karaoke-line', className)}
                style={style}
                {...props}
            >
                <Stack align="stretch" gap={0} w="100%">
                    {cueLines.map((cueLine, cueLineIndex) => {
                        const agent = agents?.find((entry) => entry.id === cueLine.agentId);
                        const isBackground = agent?.role === 'bg' || agent?.role === 'group';
                        const romajiCueLine = romajiCueLines?.[cueLineIndex];
                        const pronunciationCueLine = pronunciationCueLines?.[cueLineIndex];
                        const translationCueLine = translationCueLines?.[cueLineIndex];

                        return (
                            <div
                                className={styles.agentLine}
                                data-agent-role={agent?.role}
                                key={`${cueLine.index}-${cueLineIndex}`}
                            >
                                <span
                                    className={styles.agentText}
                                    id={
                                        cueLineIndex === 0
                                            ? `karaoke-anchor-${lineIndex}`
                                            : undefined
                                    }
                                >
                                    {renderWordSpans(
                                        cueLine,
                                        lineIndex,
                                        cueLineIndex,
                                        isBackground,
                                        'main',
                                    )}
                                </span>
                                {romajiCueLine && (
                                    <span className={styles.overlayLine}>
                                        {renderWordSpans(
                                            romajiCueLine,
                                            lineIndex,
                                            cueLineIndex,
                                            false,
                                            'overlay-pronunciation',
                                        )}
                                    </span>
                                )}
                                {!romajiCueLine &&
                                    pronunciationCueLine &&
                                    renderOverlayCueLineRow(
                                        pronunciationCueLine,
                                        lineIndex,
                                        cueLineIndex,
                                        'overlay-pronunciation',
                                        styles.overlayLine,
                                    )}
                                {translationCueLine &&
                                    renderOverlayCueLineRow(
                                        translationCueLine,
                                        lineIndex,
                                        cueLineIndex,
                                        'overlay-translation',
                                        styles.translationLine,
                                    )}
                            </div>
                        );
                    })}
                    {pronunciationFallbackText && (
                        <span
                            className={styles.overlayLine}
                            dangerouslySetInnerHTML={{
                                __html: sanitize(pronunciationFallbackText),
                            }}
                        />
                    )}
                    {!hasSyncedTranslation && translatedText && (
                        <span
                            className={styles.translationLine}
                            dangerouslySetInnerHTML={{ __html: sanitize(translatedText) }}
                        />
                    )}
                    {extraOverlays?.map((overlay, overlayIndex) => {
                        const hasSyncedExtra = hasSyncedOverlayCueLines(overlay.cueLines);

                        if (hasSyncedExtra && overlay.cueLines) {
                            return overlay.cueLines.map((cueLine, cueLineIndex) => (
                                <span
                                    className={styles.overlayLine}
                                    key={`extra-overlay-${overlayIndex}-cue-${cueLineIndex}`}
                                >
                                    {renderWordSpans(
                                        cueLine,
                                        lineIndex,
                                        cueLineIndex,
                                        false,
                                        'overlay-generic',
                                    )}
                                </span>
                            ));
                        }

                        if (overlay.text) {
                            return (
                                <span
                                    className={styles.overlayLine}
                                    dangerouslySetInnerHTML={{ __html: sanitize(overlay.text) }}
                                    key={`extra-overlay-${overlayIndex}`}
                                />
                            );
                        }

                        return null;
                    })}
                </Stack>
            </Box>
        );
    },
);

KaraokeLyricLine.displayName = 'KaraokeLyricLine';
