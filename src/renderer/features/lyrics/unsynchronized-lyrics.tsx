import { useMemo } from 'react';

import styles from './unsynchronized-lyrics.module.css';

import { LyricLine } from '/@/renderer/features/lyrics/lyric-line';
import { useLyricsSettings } from '/@/renderer/store';
import { FullLyricsMetadata } from '/@/shared/types/domain-types';

export interface UnsynchronizedLyricsProps extends Omit<FullLyricsMetadata, 'lyrics'> {
    lyrics: string;
    translatedLyrics?: null | string;
}

export const UnsynchronizedLyrics = ({
    artist,
    lyrics,
    name,
    remote,
    source,
    translatedLyrics,
}: UnsynchronizedLyricsProps) => {
    const settings = useLyricsSettings();
    const lines = useMemo(() => {
        return lyrics.split('\n');
    }, [lyrics]);

    const translatedLines = useMemo(() => {
        return translatedLyrics ? translatedLyrics.split('\n') : [];
    }, [translatedLyrics]);

    return (
        <div
            className={styles.container}
            style={{ gap: `${settings.gapUnsync}px` }}
        >
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
                <div key={idx}>
                    <LyricLine
                        alignment={settings.alignment}
                        className="lyric-line unsynchronized"
                        fontSize={settings.fontSizeUnsync}
                        id={`lyric-${idx}`}
                        text={text}
                    />
                    {translatedLines[idx] && (
                        <LyricLine
                            alignment={settings.alignment}
                            className="lyric-line unsynchronized translation"
                            fontSize={settings.fontSizeUnsync * 0.8}
                            text={translatedLines[idx]}
                        />
                    )}
                </div>
            ))}
        </div>
    );
};
