/**
 * Whether an error is the caller giving up rather than the service failing.
 *
 * The distinction decides whether a partial result may be returned. Every network walk in this
 * feature collects what it can and tolerates a source that fails, which is right for a dead
 * outlet or a shed request and wrong for an abort: a cancelled walk returns whatever it had
 * reached, React Query records that as a success, and an empty answer is then cached for as
 * long as a real one. Observed on the MusicBrainz row, which cached "no related bands" for a
 * week after a query key change cancelled it three seeds in.
 */
export function isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === 'AbortError';
}
