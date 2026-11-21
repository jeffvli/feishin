import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { KeyDetectionQueue } from '/@/renderer/features/key-detection/key-detection-queue';

type Outcome = Error | null | string;

const song = (id: string) => ({ _serverId: 'server', id });

const settle = () => new Promise((resolve) => setImmediate(resolve));

const setup = () => {
    const started: string[] = [];
    const finishers = new Map<string, (outcome: Outcome) => void>();
    const detected: Record<string, string> = {};
    const failed: string[] = [];
    let autoDetect = true;

    const queue = new KeyDetectionQueue({
        detect: (item) => {
            started.push(item.id);
            return new Promise<null | string>((resolve, reject) =>
                finishers.set(item.id, (outcome) =>
                    outcome instanceof Error ? reject(outcome) : resolve(outcome),
                ),
            );
        },
        isAutoDetectEnabled: () => autoDetect,
        onDetected: (item, key) => {
            detected[item.id] = key;
        },
        onFailed: (item) => {
            failed.push(item.id);
        },
    });

    const finish = async (id: string, outcome: Outcome) => {
        const finisher = finishers.get(id);
        assert.ok(finisher, `${id} was not started`);
        finisher(outcome);
        await settle();
    };

    const setAutoDetect = (value: boolean) => {
        autoDetect = value;
    };

    return { detected, failed, finish, queue, setAutoDetect, started };
};

describe('automatic key detection', () => {
    it('detects one song at a time, starting with the most recently shown', async () => {
        const { detected, finish, queue, started } = setup();

        queue.requestAutomatic(song('a'), null);
        queue.requestAutomatic(song('b'), null);
        queue.requestAutomatic(song('c'), null);
        await settle();
        assert.deepEqual(started, ['a']);

        await finish('a', '8A');
        assert.deepEqual(started, ['a', 'c']);

        await finish('c', '1B');
        await finish('b', '2A');
        assert.deepEqual(started, ['a', 'c', 'b']);
        assert.deepEqual(detected, { a: '8A', b: '2A', c: '1B' });
    });

    it('moves a song shown again to the front without detecting it twice', async () => {
        const { finish, queue, started } = setup();

        queue.requestAutomatic(song('a'), null);
        queue.requestAutomatic(song('b'), null);
        queue.requestAutomatic(song('c'), null);
        queue.requestAutomatic(song('b'), null);
        queue.requestAutomatic(song('a'), null);

        await finish('a', '8A');
        await finish('b', '8A');
        await finish('c', '8A');
        assert.deepEqual(started, ['a', 'b', 'c']);
    });

    it('ignores missing songs and songs that already have a key', async () => {
        const { queue, started } = setup();

        queue.requestAutomatic(undefined, null);
        queue.requestAutomatic(song('a'), '8A');
        await settle();

        assert.deepEqual(started, []);
    });

    it('does not retry a song it already tried', async () => {
        const { failed, finish, queue, started } = setup();

        queue.requestAutomatic(song('a'), null);
        queue.requestAutomatic(song('b'), null);
        await finish('a', new Error('stream failed'));
        await finish('b', null);

        queue.requestAutomatic(song('a'), null);
        queue.requestAutomatic(song('b'), null);
        await settle();

        assert.deepEqual(started, ['a', 'b']);
        assert.deepEqual(failed, ['a']);
    });

    it('drops the songs still waiting once it is turned off', async () => {
        const { finish, queue, setAutoDetect, started } = setup();

        queue.requestAutomatic(song('a'), null);
        queue.requestAutomatic(song('b'), null);
        setAutoDetect(false);
        await finish('a', '8A');
        assert.deepEqual(started, ['a']);

        setAutoDetect(true);
        queue.requestAutomatic(song('b'), null);
        await settle();
        assert.deepEqual(started, ['a', 'b']);
    });
});

describe('detecting a selection of songs', () => {
    it('detects the songs in order and reports the counts once all of them ran', async () => {
        const { detected, finish, queue, started } = setup();
        const reports: string[] = [];

        queue.enqueueBatch([song('a'), song('b'), song('c')], {
            detected: (count) => reports.push(`detected ${count}`),
            failed: (count) => reports.push(`failed ${count}`),
        });

        await finish('a', '8A');
        await finish('b', new Error('stream failed'));
        assert.deepEqual(reports, []);

        await finish('c', null);
        assert.deepEqual(started, ['a', 'b', 'c']);
        assert.deepEqual(detected, { a: '8A' });
        assert.deepEqual(reports, ['detected 1', 'failed 1']);
    });

    it('reports nothing when no key was found', async () => {
        const { finish, queue } = setup();
        const reports: string[] = [];

        queue.enqueueBatch([song('a')], {
            detected: (count) => reports.push(`detected ${count}`),
            failed: (count) => reports.push(`failed ${count}`),
        });
        await finish('a', null);

        assert.deepEqual(reports, []);
    });

    it('runs even when automatic detection is off, sharing a run already in progress', async () => {
        const { finish, queue, setAutoDetect, started } = setup();
        const reports: string[] = [];

        queue.requestAutomatic(song('a'), null);
        setAutoDetect(false);
        queue.enqueueBatch([song('a'), song('b')], {
            detected: (count) => reports.push(`detected ${count}`),
            failed: (count) => reports.push(`failed ${count}`),
        });

        await finish('a', '8A');
        await finish('b', '9A');

        assert.deepEqual(started, ['a', 'b']);
        assert.deepEqual(reports, ['detected 2']);
    });
});
