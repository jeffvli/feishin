import clsx from 'clsx';
import { useMemo } from 'react';

import styles from './unsynchronized-lyrics.module.css';

import { LyricsScrollContent } from '/@/renderer/features/lyrics/components/lyrics-scroll-content';
import { LyricLine } from '/@/renderer/features/lyrics/lyric-line';
import { useLyricsDisplaySettings, useLyricsSettings } from '/@/renderer/store';
import { FullLyricsMetadata } from '/@/shared/types/domain-types';

export interface UnsynchronizedLyricsProps extends Omit<FullLyricsMetadata, 'lyrics'> {
    lyrics: string;
    preview?: boolean;
    romajiLyrics?: null | string;
    settingsKey?: string;
    translatedLyrics?: null | string;
}

const PREVIEW_FONT_SIZE = 20;
const PREVIEW_GAP = 20;

export const UnsynchronizedLyrics = ({
    artist,
    lyrics,
    name,
    preview = false,
    romajiLyrics,
    settingsKey = 'default',
    source,
    translatedLyrics,
}: UnsynchronizedLyricsProps) => {
    const lyricsSettings = useLyricsSettings();
    const displaySettings = useLyricsDisplaySettings(settingsKey);
    const settings = {
        ...lyricsSettings,
        fontSizeUnsync: preview
            ? PREVIEW_FONT_SIZE
            : displaySettings.fontSizeUnsync && displaySettings.fontSizeUnsync !== 0
              ? displaySettings.fontSizeUnsync
              : 24,
        gapUnsync: preview
            ? PREVIEW_GAP
            : displaySettings.gapUnsync && displaySettings.gapUnsync !== 0
              ? displaySettings.gapUnsync
              : 24,
    };
    const lines = useMemo(() => {
        return lyrics.split('\n');
    }, [lyrics]);

    const translatedLines = useMemo(() => {
        return translatedLyrics ? translatedLyrics.split('\n') : [];
    }, [translatedLyrics]);

    const romajiLines = useMemo(() => {
        return romajiLyrics ? romajiLyrics.split('\n') : [];
    }, [romajiLyrics]);

    return (
        <div className={clsx(styles.container, preview && styles.preview)}>
            <LyricsScrollContent
                bottomScrollPadding="6vh"
                gap={settings.gapUnsync}
                paddingLeft={preview ? 0 : (displaySettings.paddingLeft ?? 0)}
                paddingRight={preview ? 0 : (displaySettings.paddingRight ?? 0)}
                preview={preview}
            >
                {settings.showProvider && source && (
                    <LyricLine
                        alignment={settings.alignment}
                        className="lyric-credit"
                        fontSize={settings.fontSizeUnsync}
                        text={`${source}`}
                    />
                )}
                {settings.showMatch && (
                    <LyricLine
                        alignment={settings.alignment}
                        className="lyric-credit"
                        fontSize={settings.fontSizeUnsync}
                        text={`${name} — ${artist}`}
                    />
                )}
                {lines.map((text, idx) => (
                    <LyricLine
                        alignment={settings.alignment}
                        className="lyric-line unsynchronized"
                        fontSize={settings.fontSizeUnsync}
                        id={`lyric-${idx}`}
                        key={idx}
                        romajiText={romajiLines[idx]}
                        text={text}
                        translatedText={translatedLines[idx]}
                    />
                ))}
            </LyricsScrollContent>
        </div>
    );
};
