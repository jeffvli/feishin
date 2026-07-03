import { useMemo } from 'react';

import styles from './unsynchronized-lyrics.module.css';

import { LyricLine } from '/@/renderer/features/lyrics/lyric-line';
import { useLyricsDisplaySettings, useLyricsSettings } from '/@/renderer/store';
import { FullLyricsMetadata } from '/@/shared/types/domain-types';

export interface UnsynchronizedLyricsProps extends Omit<FullLyricsMetadata, 'lyrics'> {
    lyrics: string;
    romajiLyrics?: null | string;
    settingsKey?: string;
    translatedLyrics?: null | string;
}

export const UnsynchronizedLyrics = ({
    artist,
    lyrics,
    name,
    remote,
    romajiLyrics,
    settingsKey = 'default',
    source,
    translatedLyrics,
}: UnsynchronizedLyricsProps) => {
    const lyricsSettings = useLyricsSettings();
    const displaySettings = useLyricsDisplaySettings(settingsKey);
    const settings = {
        ...lyricsSettings,
        fontSizeUnsync:
            displaySettings.fontSizeUnsync && displaySettings.fontSizeUnsync !== 0
                ? displaySettings.fontSizeUnsync
                : 24,
        gapUnsync:
            displaySettings.gapUnsync && displaySettings.gapUnsync !== 0
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
        <div className={styles.container} style={{ gap: `${settings.gapUnsync}px` }}>
            {settings.showProvider && source && (
                <LyricLine
                    alignment={settings.alignment}
                    className="lyric-credit"
                    fontSize={settings.fontSizeUnsync}
                    text={`Provided by ${source}`}
                />
            )}
            {settings.showMatch && remote && (
                <LyricLine
                    alignment={settings.alignment}
                    className="lyric-credit"
                    fontSize={settings.fontSizeUnsync}
                    text={`"${name} by ${artist}"`}
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
        </div>
    );
};
