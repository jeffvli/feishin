import { useEffect, useCallback, useState, useRef } from 'react';
import { QueueSong, ServerType } from '/@/renderer/api/types';
import { useSendScrobble } from '/@/renderer/features/player/mutations/scrobble-mutation';
import { useCurrentStatus, usePlayerStore } from '/@/renderer/store';
import { usePlaybackSettings } from '/@/renderer/store/settings.store';
import { PlayerStatus } from '/@/renderer/types';

/*
 Scrobble Conditions (match any):
  - If the song has been played for the required percentage
  - If the song has been played for the required duration

Scrobble Events:
  - When the song changes (or is completed):
    - Current song: Sends the 'playing' scrobble event
    - Previous song (if exists): Sends the 'submission' scrobble event if conditions are met AND the 'isCurrentSongScrobbled' state is false
    - Resets the 'isCurrentSongScrobbled' state to false

  - When the song is paused:
    - Sends the 'submission' scrobble event if conditions are met AND the 'isCurrentSongScrobbled' state is false
    - Sends the 'pause' scrobble event (Jellyfin only)

  - When the song is restarted:
    - Sends the 'submission' scrobble event if conditions are met AND the 'isCurrentSongScrobbled' state is false
    - Resets the 'isCurrentSongScrobbled' state to false

  - When the song is seeked:
    - Sends the 'timeupdate' scrobble event (Jellyfin only)


Progress Events (Jellyfin only):
  - When the song is playing:
    - Sends the 'progress' scrobble event on an interval
*/

const checkScrobbleConditions = (args: {
  scrobbleAtDuration: number;
  scrobbleAtPercentage: number;
  songCompletedDuration: number;
  songDuration: number;
}) => {
  const { scrobbleAtDuration, scrobbleAtPercentage, songCompletedDuration, songDuration } = args;
  const percentageOfSongCompleted = songDuration ? (songCompletedDuration / songDuration) * 100 : 0;

  return (
    percentageOfSongCompleted >= scrobbleAtPercentage || songCompletedDuration >= scrobbleAtDuration
  );
};

export const useScrobble = () => {
  const status = useCurrentStatus();
  const scrobbleSettings = usePlaybackSettings().scrobble;
  const isScrobbleEnabled = scrobbleSettings?.enabled;
  const sendScrobble = useSendScrobble();

  const [isCurrentSongScrobbled, setIsCurrentSongScrobbled] = useState(false);

  const handleScrobbleFromSeek = useCallback(
    (currentTime: number) => {
      if (!isScrobbleEnabled) return;

      const currentSong = usePlayerStore.getState().current.song;

      if (!currentSong?.id || currentSong?.serverType !== ServerType.JELLYFIN) return;

      const position =
        currentSong?.serverType === ServerType.JELLYFIN ? currentTime * 1e7 : undefined;

      sendScrobble.mutate({
        _serverId: currentSong?.serverId,
        query: {
          event: 'timeupdate',
          id: currentSong.id,
          position,
          submission: false,
        },
      });
    },
    [isScrobbleEnabled, sendScrobble],
  );

  const progressIntervalId = useRef<ReturnType<typeof setInterval> | null>(null);
  const songChangeTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleScrobbleFromSongChange = useCallback(
    (current: (QueueSong | number | undefined)[], previous: (QueueSong | number | undefined)[]) => {
      if (!isScrobbleEnabled) return;

      if (progressIntervalId.current) {
        clearInterval(progressIntervalId.current);
      }

      // const currentSong = current[0] as QueueSong | undefined;
      const previousSong = previous[0] as QueueSong;
      const previousSongTime = previous[1] as number;

      // Send completion scrobble when song changes and a previous song exists
      if (previousSong?.id) {
        const shouldSubmitScrobble = checkScrobbleConditions({
          scrobbleAtDuration: scrobbleSettings?.scrobbleAtDuration,
          scrobbleAtPercentage: scrobbleSettings?.scrobbleAtPercentage,
          songCompletedDuration: previousSongTime,
          songDuration: previousSong.duration,
        });

        if (
          (!isCurrentSongScrobbled && shouldSubmitScrobble) ||
          previousSong?.serverType === ServerType.JELLYFIN
        ) {
          const position =
            previousSong?.serverType === ServerType.JELLYFIN ? previousSongTime * 1e7 : undefined;

          sendScrobble.mutate({
            _serverId: previousSong?.serverId,
            query: {
              id: previousSong.id,
              position,
              submission: true,
            },
          });
        }
      }

      setIsCurrentSongScrobbled(false);

      // Use a timeout to prevent spamming the server with scrobble events when switching through songs quickly
      clearTimeout(songChangeTimeoutId.current as ReturnType<typeof setTimeout>);
      songChangeTimeoutId.current = setTimeout(() => {
        const currentSong = current[0] as QueueSong | undefined;

        // Send start scrobble when song changes and the new song is playing
        if (status === PlayerStatus.PLAYING && currentSong?.id) {
          sendScrobble.mutate({
            _serverId: currentSong?.serverId,
            query: {
              event: 'start',
              id: currentSong.id,
              position: 0,
              submission: false,
            },
          });

          if (currentSong?.serverType === ServerType.JELLYFIN) {
            progressIntervalId.current = setInterval(() => {
              const currentTime = usePlayerStore.getState().current.time;
              handleScrobbleFromSeek(currentTime);
            }, 10000);
          }
        }
      }, 2000);
    },
    [
      isScrobbleEnabled,
      scrobbleSettings?.scrobbleAtDuration,
      scrobbleSettings?.scrobbleAtPercentage,
      isCurrentSongScrobbled,
      sendScrobble,
      status,
      handleScrobbleFromSeek,
    ],
  );

  const handleScrobbleFromStatusChange = useCallback(
    (status: PlayerStatus | undefined) => {
      if (!isScrobbleEnabled) return;

      const currentSong = usePlayerStore.getState().current.song;

      if (!currentSong?.id) return;

      const position =
        currentSong?.serverType === ServerType.JELLYFIN
          ? usePlayerStore.getState().current.time * 1e7
          : undefined;

      // Whenever the player is restarted, send a 'start' scrobble
      if (status === PlayerStatus.PLAYING) {
        sendScrobble.mutate({
          _serverId: currentSong?.serverId,
          query: {
            event: 'unpause',
            id: currentSong.id,
            position,
            submission: false,
          },
        });

        if (currentSong?.serverType === ServerType.JELLYFIN) {
          progressIntervalId.current = setInterval(() => {
            const currentTime = usePlayerStore.getState().current.time;
            handleScrobbleFromSeek(currentTime);
          }, 10000);
        }

        // Jellyfin is the only one that needs to send a 'pause' event to the server
      } else if (currentSong?.serverType === ServerType.JELLYFIN) {
        sendScrobble.mutate({
          _serverId: currentSong?.serverId,
          query: {
            event: 'pause',
            id: currentSong.id,
            position,
            submission: false,
          },
        });

        if (progressIntervalId.current) {
          clearInterval(progressIntervalId.current as ReturnType<typeof setInterval>);
        }
      } else {
        // If not already scrobbled, send a 'submission' scrobble if conditions are met
        const shouldSubmitScrobble = checkScrobbleConditions({
          scrobbleAtDuration: scrobbleSettings?.scrobbleAtDuration,
          scrobbleAtPercentage: scrobbleSettings?.scrobbleAtPercentage,
          songCompletedDuration: usePlayerStore.getState().current.time,
          songDuration: currentSong.duration,
        });

        if (!isCurrentSongScrobbled && shouldSubmitScrobble) {
          sendScrobble.mutate({
            _serverId: currentSong?.serverId,
            query: {
              id: currentSong.id,
              submission: true,
            },
          });

          setIsCurrentSongScrobbled(true);
        }
      }
    },
    [
      isScrobbleEnabled,
      sendScrobble,
      handleScrobbleFromSeek,
      scrobbleSettings?.scrobbleAtDuration,
      scrobbleSettings?.scrobbleAtPercentage,
      isCurrentSongScrobbled,
    ],
  );

  // When pressing the "Previous Track" button, the player will restart the current song if the
  // currentTime is >= 10 seconds. Since the song / status change events are not triggered, we will
  // need to perform another check to see if the scrobble conditions are met
  const handleScrobbleFromSongRestart = useCallback(
    (currentTime: number) => {
      if (!isScrobbleEnabled) return;

      const currentSong = usePlayerStore.getState().current.song;

      if (!currentSong?.id) return;

      const position =
        currentSong?.serverType === ServerType.JELLYFIN ? currentTime * 1e7 : undefined;

      const shouldSubmitScrobble = checkScrobbleConditions({
        scrobbleAtDuration: scrobbleSettings?.scrobbleAtDuration,
        scrobbleAtPercentage: scrobbleSettings?.scrobbleAtPercentage,
        songCompletedDuration: currentTime,
        songDuration: currentSong.duration,
      });

      if (!isCurrentSongScrobbled && shouldSubmitScrobble) {
        sendScrobble.mutate({
          _serverId: currentSong?.serverId,
          query: {
            id: currentSong.id,
            position,
            submission: true,
          },
        });
      }

      if (currentSong?.serverType === ServerType.JELLYFIN) {
        sendScrobble.mutate({
          _serverId: currentSong?.serverId,
          query: {
            event: 'start',
            id: currentSong.id,
            position: 0,
            submission: false,
          },
        });
      }

      setIsCurrentSongScrobbled(false);
    },
    [
      isScrobbleEnabled,
      scrobbleSettings?.scrobbleAtDuration,
      scrobbleSettings?.scrobbleAtPercentage,
      isCurrentSongScrobbled,
      sendScrobble,
    ],
  );

  useEffect(() => {
    const unsubSongChange = usePlayerStore.subscribe(
      (state) => [state.current.song, state.current.time],
      handleScrobbleFromSongChange,
      {
        // We need the current time to check the scrobble condition, but we only want to
        // trigger the callback when the song changes
        equalityFn: (a, b) => (a[0] as QueueSong)?.id === (b[0] as QueueSong)?.id,
      },
    );

    const unsubStatusChange = usePlayerStore.subscribe(
      (state) => state.current.status,
      handleScrobbleFromStatusChange,
    );

    return () => {
      unsubSongChange();
      unsubStatusChange();
    };
  }, [handleScrobbleFromSongChange, handleScrobbleFromStatusChange]);

  return { handleScrobbleFromSeek, handleScrobbleFromSongRestart };
};
