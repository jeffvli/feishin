export type QueueBackgroundDropMode = 'append' | 'start';

export function getQueueBackgroundDropMode(queueLength: number): QueueBackgroundDropMode {
    return queueLength > 0 ? 'append' : 'start';
}
