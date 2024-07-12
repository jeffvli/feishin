import { Box, Group, Timeline, Text } from '@mantine/core';
import { RiSettings2Fill } from 'react-icons/ri';
import { useParams } from 'react-router';
import styled from 'styled-components';
import { IderTrack, LibraryItem } from '/@/renderer/api/types';
import { Button, Popover } from '/@/renderer/components';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { PlayButton } from '/@/renderer/features/shared';
import { LibraryBackgroundOverlay } from '/@/renderer/features/shared/components/library-background-overlay';
import { getPublicServer, useCurrentTime } from '/@/renderer/store';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { Play } from '/@/renderer/types';
import { useTrackList } from '/@/renderer/features/songs/queries/track-list-query';
import { useContainerQuery } from '/@/renderer/hooks';
import { useSongInfo } from '/@/renderer/features/songs/queries/song-info-query';

const ContentContainer = styled.div`
    position: relative;
    z-index: 0;
`;

const DetailContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 1rem 2rem 5rem;
    overflow: hidden;
`;

interface MixInfoContentProps {
    background?: string;
}

function timeFormat(duration: number): string {
    // Hours, minutes and seconds
    const hrs = Math.floor(duration / 3600);
    const mins = Math.floor((duration % 3600) / 60);
    const secs = Math.floor(duration % 60);

    // Output like "1:01" or "4:03:59" or "123:03:59"
    let ret = '';

    if (hrs > 0) {
        ret += `${hrs}:${mins < 10 ? '0' : ''}`;
    }

    ret += `${mins}:${secs < 10 ? '0' : ''}`;
    ret += `${secs}`;

    return ret;
}

function makeTrackId(track: IderTrack): string {
    return `${track.artist}-${track.title}`;
}

function getTrackNumber(curTime: number, startToTrackNumberMap: Map<number, number>): number {
    for (const [startTime, trackNumber] of startToTrackNumberMap.entries()) {
        if (curTime < startTime) {
            return trackNumber - 1;
        }
    }
    const lastTrackNumber = Array.from(startToTrackNumberMap.values()).pop();
    return lastTrackNumber as number;
}

export const MixInfoContent = ({ background }: MixInfoContentProps) => {
    const { songId } = useParams() as { songId: string };
    const server = getPublicServer();
    const songDetailQuery = useSongInfo({ query: { id: songId }, serverId: server?.id });
    const cq = useContainerQuery();
    const now = useCurrentTime();

    const detailQuery = useTrackList({
        options: {
            enabled: !!songDetailQuery?.data?.beetId,
        },
        query: { track_id: songDetailQuery?.data?.beetId || 0 },
        serverId: server?.id,
    });
    const tracklist = detailQuery.data;

    const handlePlayQueueAdd = usePlayQueueAdd();

    const playButtonBehavior = usePlayButtonBehavior();

    const handlePlay = async (playType?: Play) => {
        handlePlayQueueAdd?.({
            byItemType: { id: [songId], type: LibraryItem.SONG },
            playType: playType || playButtonBehavior,
            publicNd: true,
        });
    };

    const isLoading = detailQuery?.isLoading;
    if (isLoading) return <ContentContainer ref={cq.ref} />;
    const trackList = tracklist ? tracklist.items : [];

    const startToIdsMap: Map<number, string> = new Map();

    for (const track of trackList) {
        startToIdsMap.set(track.start, makeTrackId(track));
    }

    console.log(startToIdsMap);
    const startToTrackNumberMap: Map<number, number> = new Map();
    let prevValue = null;
    let trackNumber = 0;
    for (const [key, trackId] of startToIdsMap.entries()) {
        if (trackId !== prevValue) {
            startToTrackNumberMap.set(key, trackNumber);
            prevValue = trackId;
            trackNumber += 1;
        } else {
            startToTrackNumberMap.set(key, trackNumber - 1);
        }
    }
    // const t = getTrackNumber(now, startToTrackNumberMap);

    return (
        <ContentContainer ref={cq.ref}>
            <LibraryBackgroundOverlay $backgroundColor={background} />
            <DetailContainer>
                <Box component="section">
                    <Group
                        position="apart"
                        spacing="sm"
                    >
                        <Group>
                            <PlayButton onClick={() => handlePlay(playButtonBehavior)} />
                        </Group>
                        <Popover position="bottom-end">
                            <Popover.Target>
                                <Button
                                    compact
                                    size="md"
                                    variant="subtle"
                                >
                                    <RiSettings2Fill size={20} />
                                </Button>
                            </Popover.Target>
                        </Popover>
                    </Group>
                </Box>
                <Box style={{ minHeight: '300px' }}>
                    <Timeline
                        active={getTrackNumber(now, startToTrackNumberMap)}
                        bulletSize={24}
                        lineWidth={1}
                    >
                        {trackList.map((track) => (
                            <Timeline.Item
                                title={`${track.artist} - ${track.title}`}
                                // bullet={
                                //    <ThemeIcon
                                //        size={22}
                                //        variant="gradient"
                                //        gradient={{ from: 'lime', to: 'cyan' }}
                                //        radius="xl" children={undefined}                            ></ThemeIcon>
                                // }
                            >
                                <Text
                                    c="dimmed"
                                    size="sm"
                                >
                                    {timeFormat(track.start)} to {timeFormat(track.end)}
                                </Text>
                            </Timeline.Item>
                        ))}
                    </Timeline>
                </Box>
            </DetailContainer>
        </ContentContainer>
    );
};
