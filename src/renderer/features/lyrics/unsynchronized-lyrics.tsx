import { useMemo } from 'react';
import styled from 'styled-components';
import { LyricLine } from '/@/renderer/features/lyrics/lyric-line';
import { FullLyricsMetadata } from '/@/renderer/api/types';
import { useLyricsSettings } from '/@/renderer/store';

export interface UnsynchronizedLyricsProps extends Omit<FullLyricsMetadata, 'lyrics'> {
    lyrics: string;
    romanizedLyrics?: string | null;
    translatedLyrics?: string | null;
}

const UnsynchronizedLyricsContainer = styled.div<{ $gap: number }>`
    display: flex;
    flex-direction: column;
    gap: ${(props) => props.$gap || 5}px;
    width: 100%;
    height: 100%;
    padding: 10vh 0 6vh;
    overflow: scroll;
    transform: translateY(-2rem);

    -webkit-mask-image: linear-gradient(
        180deg,
        transparent 5%,
        rgb(0 0 0 / 100%) 20%,
        rgb(0 0 0 / 100%) 85%,
        transparent 95%
    );

    mask-image: linear-gradient(
        180deg,
        transparent 5%,
        rgb(0 0 0 / 100%) 20%,
        rgb(0 0 0 / 100%) 85%,
        transparent 95%
    );

    @media screen and (orientation: portrait) {
        padding: 5vh 0;
    }
`;

export const UnsynchronizedLyrics = ({
    artist,
    lyrics,
    name,
    remote,
    source,
    romanizedLyrics,
    translatedLyrics,
}: UnsynchronizedLyricsProps) => {
    const settings = useLyricsSettings();
    const lines = useMemo(() => {
        return lyrics.split('\n');
    }, [lyrics]);

    const romanizedLines = useMemo(() => {
        return romanizedLyrics ? romanizedLyrics.split('\n') : [];
    }, [romanizedLyrics]);

    const translatedLines = useMemo(() => {
        return translatedLyrics ? translatedLyrics.split('\n') : [];
    }, [translatedLyrics]);

    return (
        <UnsynchronizedLyricsContainer
            $gap={settings.gapUnsync}
            className="unsynchronized-lyrics"
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
                    {romanizedLines[idx] && (
                        <LyricLine
                            alignment={settings.alignment}
                            className="lyric-line unsynchronized romaji"
                            fontSize={settings.fontSizeUnsync}
                            text={romanizedLines[idx]}
                        />
                    )}
                    {translatedLines[idx] && (
                        <LyricLine
                            alignment={settings.alignment}
                            className="lyric-line unsynchronized translation"
                            fontSize={settings.fontSizeUnsync}
                            text={translatedLines[idx]}
                        />
                    )}
                </div>
            ))}
        </UnsynchronizedLyricsContainer>
    );
};
