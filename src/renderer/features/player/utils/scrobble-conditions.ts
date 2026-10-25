// Whether enough of the song has been listened to for a scrobble submission
export const checkScrobbleConditions = (args: {
    minimumMode: 'both' | 'percentage' | 'seconds';
    scrobbleAtDurationMs: number;
    scrobbleAtPercentage: number;
    songCompletedDurationMs: number;
    songDurationMs: number;
}) => {
    const {
        minimumMode,
        scrobbleAtDurationMs,
        scrobbleAtPercentage,
        songCompletedDurationMs,
        songDurationMs,
    } = args;
    const percentageOfSongCompleted = songDurationMs
        ? (songCompletedDurationMs / songDurationMs) * 100
        : 0;

    const shouldScrobbleBasedOnPercentage = percentageOfSongCompleted >= scrobbleAtPercentage;
    const shouldScrobbleBasedOnDuration = songCompletedDurationMs >= scrobbleAtDurationMs;

    switch (minimumMode) {
        case 'both':
            return shouldScrobbleBasedOnPercentage || shouldScrobbleBasedOnDuration;
        case 'percentage':
            return shouldScrobbleBasedOnPercentage;
        case 'seconds':
            return shouldScrobbleBasedOnDuration;
        default:
            return shouldScrobbleBasedOnPercentage || shouldScrobbleBasedOnDuration;
    }
};
