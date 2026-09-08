import { t } from 'i18next';
import { generatePath, Link } from 'react-router';
import { Fragment } from 'react/jsx-runtime';

import styles from './shared-full-screen-player-metadata.module.css';

import {
    useIsRadioActive,
    useRadioPlayer,
} from '/@/renderer/features/radio/hooks/use-radio-player';
import { AppRoute } from '/@/renderer/router/routes';
import {
    PlayerItem,
    useFullScreenPlayerStore,
    useGeneralSettings,
    usePlayerSong,
} from '/@/renderer/store';
import { formatPartialIsoDateUTC } from '/@/renderer/utils';
import { Badge } from '/@/shared/components/badge/badge';
import { Group } from '/@/shared/components/group/group';
import { Stack } from '/@/shared/components/stack/stack';
import { TextScrolling } from '/@/shared/components/text-scrolling/text-scrolling';
import { Text } from '/@/shared/components/text/text';
import { useMediaQuery } from '/@/shared/hooks/use-media-query';

type SharedFullscreenPlayerMetadataProps = {
    imageContainerWidth?: null | number;
};

export const SharedFullscreenPlayerMetadata = ({
    imageContainerWidth,
}: SharedFullscreenPlayerMetadataProps) => {
    const currentSong = usePlayerSong();
    const isRadioActive = useIsRadioActive();
    const { isPlaying: isRadioPlaying, metadata: radioMetadata, stationName } = useRadioPlayer();
    const isPlayingRadio = isRadioActive && isRadioPlaying;

    const { playerItemAlignment, titleDisplayType, titleLineCount } = useFullScreenPlayerStore();
    const { playerItems } = useGeneralSettings();

    const isMobileView = useMediaQuery('(orientation: portrait)');

    const isItemEnabled = (item: PlayerItem) =>
        !playerItems.find((entry) => entry.id === item)?.disabled;
    const showTitle = isItemEnabled(PlayerItem.TITLE);
    const showArtist = isItemEnabled(PlayerItem.ARTIST);
    const showAlbum = isItemEnabled(PlayerItem.ALBUM);

    const builtDataItems = {
        bit_depth: currentSong?.bitDepth && <Badge>{currentSong?.bitDepth} bit</Badge>,
        bit_rate: currentSong?.bitRate && <Badge>{currentSong?.bitRate} kbps</Badge>,
        bpm: currentSong?.bpm && (
            <Badge>
                {currentSong?.bpm} {t('common.bpm')}
            </Badge>
        ),
        codec: currentSong?.container && <Badge>{currentSong?.container}</Badge>,
        date: currentSong?.date && <Badge>{formatPartialIsoDateUTC(currentSong?.date)}</Badge>,
        disc_number: currentSong?.discNumber && (
            <Badge>
                {t('common.disc')} {currentSong?.discNumber}
            </Badge>
        ),
        genres:
            currentSong?.genres &&
            currentSong?.genres
                .slice(0, 2)
                .map((genre) => <Badge key={genre.id}>{genre.name}</Badge>),
        release_date: currentSong?.releaseDate && (
            <Badge>{formatPartialIsoDateUTC(currentSong?.releaseDate)}</Badge>
        ),
        release_type: currentSong?.tags?.releasetype && (
            <Badge>{currentSong?.tags?.releasetype[0]}</Badge>
        ),
        release_year: currentSong?.releaseYear && <Badge>{currentSong?.releaseYear}</Badge>,
        sample_rate: currentSong?.sampleRate && <Badge>{currentSong?.sampleRate / 1000} kHz</Badge>,
        track_number: currentSong?.trackNumber && (
            <Badge>
                {t('common.trackNumber')} {currentSong?.trackNumber}
            </Badge>
        ),
        year: currentSong?.year && <Badge>{currentSong?.year}</Badge>,
    };

    const hasMetadata =
        !isPlayingRadio && playerItems.some((i) => !i.disabled && builtDataItems[i.id]);

    const showMetadata =
        playerItems.some((i) => !i.disabled && builtDataItems[i.id]) ||
        showTitle ||
        showArtist ||
        showAlbum;
    const metadataAlignment =
        playerItemAlignment === 'center'
            ? 'center'
            : playerItemAlignment === 'right'
              ? 'flex-end'
              : 'flex-start';
    const metadataTextAlign =
        playerItemAlignment === 'center'
            ? 'center'
            : playerItemAlignment === 'right'
              ? 'right'
              : 'left';
    const metadataMaxWidth = isMobileView
        ? '90%'
        : imageContainerWidth
          ? imageContainerWidth < 300
              ? '80%'
              : `${imageContainerWidth}px`
          : '80%';

    return (
        <>
            {showMetadata && (
                <Stack
                    className={styles.metadataContainer}
                    gap="md"
                    maw={metadataMaxWidth}
                    style={{
                        alignItems: metadataAlignment,
                        textAlign: metadataTextAlign,
                    }}
                >
                    {showTitle &&
                        (titleDisplayType === 'scroll' ? (
                            <TextScrolling
                                fw={900}
                                gap={100}
                                lh="1.2"
                                pause={5}
                                size="4xl"
                                speed={50}
                            >
                                {isPlayingRadio
                                    ? radioMetadata?.title || stationName || 'Radio'
                                    : currentSong?.name}
                            </TextScrolling>
                        ) : (
                            <Text
                                fw={900}
                                lh="1.2"
                                size="4xl"
                                style={{
                                    display: '-webkit-box',
                                    overflow: 'hidden',
                                    WebkitBoxOrient: 'vertical',
                                    WebkitLineClamp: titleLineCount,
                                }}
                                w="100%"
                            >
                                {isPlayingRadio
                                    ? radioMetadata?.title || stationName || 'Radio'
                                    : currentSong?.name}
                            </Text>
                        ))}
                    {showArtist && (
                        <Text key="fs-artists" size="xl">
                            {isPlayingRadio
                                ? radioMetadata?.artist || stationName || 'Radio'
                                : currentSong?.artists?.map((artist, index) => (
                                      <Fragment key={`fs-artist-${artist.id}`}>
                                          {index > 0 && (
                                              <Text
                                                  style={{
                                                      display: 'inline-block',
                                                      padding: '0 0.5rem',
                                                  }}
                                              >
                                                  •
                                              </Text>
                                          )}
                                          <Text
                                              component={Link}
                                              isLink
                                              to={generatePath(
                                                  AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL,
                                                  {
                                                      albumArtistId: artist.id,
                                                  },
                                              )}
                                          >
                                              {artist.name}
                                          </Text>
                                      </Fragment>
                                  ))}
                        </Text>
                    )}
                    {showAlbum &&
                        (isPlayingRadio ? (
                            <Text overflow="hidden" size="xl" w="100%">
                                {stationName || 'Radio'}
                            </Text>
                        ) : (
                            <Text
                                component={Link}
                                isLink
                                overflow="hidden"
                                size="xl"
                                to={generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, {
                                    albumId: currentSong?.albumId || '',
                                })}
                                w="100%"
                            >
                                {currentSong?.album}
                            </Text>
                        ))}
                    {!isPlayingRadio && hasMetadata && (
                        <Group justify={metadataAlignment} mt="sm" w="100%">
                            {playerItems.map((i) => !i.disabled && builtDataItems[i.id])}
                        </Group>
                    )}
                </Stack>
            )}
        </>
    );
};
