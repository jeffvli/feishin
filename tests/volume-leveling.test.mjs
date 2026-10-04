import assert from 'node:assert/strict';
import test from 'node:test';

import {
    buildMpvAudioFilters,
    buildMpvVolumeLevelingFilters,
    calculateReplayGainMultiplier,
    configureCompressorNode,
    getReplayGainMode,
    migrateVolumeLevelingSettings,
    VOLUME_LEVELING_MODE,
} from '../src/renderer/features/player/audio-player/utils/volume-leveling.ts';

test('natural levelling uses track gain and a final limiter', () => {
    assert.equal(getReplayGainMode(VOLUME_LEVELING_MODE.NATURAL), 'track');

    const filters = buildMpvVolumeLevelingFilters(VOLUME_LEVELING_MODE.NATURAL, false);
    assert.equal(filters.length, 1);
    assert.match(filters[0], /alimiter=/);
    assert.match(filters[0], /latency=true/);
});

test('tavern levelling adds gentle compression before the final limiter', () => {
    const filters = buildMpvVolumeLevelingFilters(VOLUME_LEVELING_MODE.TAVERN, false);

    assert.equal(filters.length, 2);
    assert.match(filters[0], /acompressor=/);
    assert.match(filters[0], /ratio=1\.5/);
    assert.match(filters[1], /alimiter=/);
});

test('turning levelling off bypasses processing unless the manual compressor needs protection', () => {
    assert.equal(getReplayGainMode(VOLUME_LEVELING_MODE.OFF), 'no');
    assert.deepEqual(buildMpvVolumeLevelingFilters(VOLUME_LEVELING_MODE.OFF, false), []);
    assert.match(buildMpvVolumeLevelingFilters(VOLUME_LEVELING_MODE.OFF, true)[0], /alimiter=/);
});

test('Jellyfin gain can raise a quiet track when peak metadata is unavailable', () => {
    const multiplier = calculateReplayGainMultiplier({
        clip: true,
        gainInfo: { track: 6 },
        mode: 'track',
        peakInfo: null,
    });

    assert.ok(Math.abs(multiplier - 1.9952623149688795) < 0.000001);
});

test('known peak metadata still caps ReplayGain before the final limiter', () => {
    const multiplier = calculateReplayGainMultiplier({
        clip: true,
        gainInfo: { track: 6 },
        mode: 'track',
        peakInfo: { track: 0.75 },
    });

    assert.ok(Math.abs(multiplier - 4 / 3) < 0.000001);
});

test('compressor configuration supports active and transparent nodes', () => {
    const node = {
        attack: { value: -1 },
        knee: { value: -1 },
        ratio: { value: -1 },
        release: { value: -1 },
        threshold: { value: -1 },
    };

    configureCompressorNode(node, {
        attack: 50,
        knee: 6,
        makeup: 2,
        ratio: 1.5,
        release: 500,
        threshold: -15,
    });
    assert.deepEqual(node, {
        attack: { value: 0.05 },
        knee: { value: 6 },
        ratio: { value: 1.5 },
        release: { value: 0.5 },
        threshold: { value: -15 },
    });

    configureCompressorNode(node, null);
    assert.deepEqual(node, {
        attack: { value: 0 },
        knee: { value: 0 },
        ratio: { value: 1 },
        release: { value: 0.25 },
        threshold: { value: 0 },
    });
});

test('existing settings migrate to safe natural levelling defaults', () => {
    const settings = {
        playback: {
            mpvProperties: {
                replayGainClip: false,
                replayGainMode: 'no',
            },
            volumeLevelingMode: 'off',
        },
    };

    migrateVolumeLevelingSettings(settings, 36);

    assert.deepEqual(settings, {
        playback: {
            mpvProperties: {
                replayGainClip: true,
                replayGainMode: 'track',
            },
            volumeLevelingMode: 'natural',
        },
    });
});

test('current settings are not overwritten by the volume levelling migration', () => {
    const settings = {
        playback: {
            mpvProperties: {
                replayGainClip: false,
                replayGainMode: 'no',
            },
            volumeLevelingMode: 'off',
        },
    };

    migrateVolumeLevelingSettings(settings, 37);

    assert.deepEqual(settings, {
        playback: {
            mpvProperties: {
                replayGainClip: false,
                replayGainMode: 'no',
            },
            volumeLevelingMode: 'off',
        },
    });
});

test('MPV applies EQ, manual compression, automatic levelling, and limiting in order', () => {
    const filters = buildMpvAudioFilters(
        {
            bands: [{ freq: 1000, gain: 2 }],
            enabled: true,
            preamp: -2,
        },
        {
            attack: 20,
            enabled: true,
            knee: 4,
            makeup: 1,
            ratio: 4,
            release: 200,
            threshold: -18,
        },
        VOLUME_LEVELING_MODE.TAVERN,
    );

    const preampIndex = filters.indexOf('volume=-2dB');
    const equalizerIndex = filters.indexOf('equalizer=f=1000');
    const manualCompressorIndex = filters.indexOf('ratio=4');
    const levelerIndex = filters.indexOf('ratio=1.5');
    const limiterIndex = filters.indexOf('alimiter=');

    assert.ok(preampIndex >= 0);
    assert.ok(preampIndex < equalizerIndex);
    assert.ok(equalizerIndex < manualCompressorIndex);
    assert.ok(manualCompressorIndex < levelerIndex);
    assert.ok(levelerIndex < limiterIndex);
});
