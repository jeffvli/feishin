import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getCamelotKeyColor, getSongCamelotKey, toCamelotKey } from '/@/renderer/utils/camelot-key';

describe('toCamelotKey', () => {
    it('places every major and minor key on the wheel', () => {
        const majors = ['B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E'];
        const minors = [
            'Abm',
            'Ebm',
            'Bbm',
            'Fm',
            'Cm',
            'Gm',
            'Dm',
            'Am',
            'Em',
            'Bm',
            'F#m',
            'C#m',
        ];

        majors.forEach((key, i) => assert.equal(toCamelotKey(key), `${i + 1}B`, key));
        minors.forEach((key, i) => assert.equal(toCamelotKey(key), `${i + 1}A`, key));
    });

    it('reads spelled out modes, unicode accidentals and stray spaces', () => {
        assert.equal(toCamelotKey('A minor'), '8A');
        assert.equal(toCamelotKey('C# min'), '12A');
        assert.equal(toCamelotKey('G major'), '9B');
        assert.equal(toCamelotKey('Gmaj'), '9B');
        assert.equal(toCamelotKey('F♯m'), '11A');
        assert.equal(toCamelotKey('B♭'), '6B');
        assert.equal(toCamelotKey('BB'), '6B');
        assert.equal(toCamelotKey('  am  '), '8A');
    });

    it('treats enharmonic spellings as the same key', () => {
        assert.equal(toCamelotKey('C#'), '3B');
        assert.equal(toCamelotKey('Db'), '3B');
        assert.equal(toCamelotKey('Cb'), '1B');
        assert.equal(toCamelotKey('B#'), '8B');
        assert.equal(toCamelotKey('G#m'), '1A');
    });

    it('keeps values already in Camelot notation', () => {
        assert.equal(toCamelotKey('8A'), '8A');
        assert.equal(toCamelotKey('08b'), '8B');
        assert.equal(toCamelotKey('12 A'), '12A');
    });

    it('converts Open Key notation', () => {
        assert.equal(toCamelotKey('1d'), '8B');
        assert.equal(toCamelotKey('1m'), '8A');
        assert.equal(toCamelotKey('2m'), '9A');
        assert.equal(toCamelotKey('12d'), '7B');
    });

    it('uses the first part it understands in combined values', () => {
        assert.equal(toCamelotKey('8A - Am'), '8A');
        assert.equal(toCamelotKey('Unknown - Am'), '8A');
        assert.equal(toCamelotKey('C#/Db'), '3B');
    });

    it('returns null for values that are not keys', () => {
        for (const value of ['', 'xyz', 'H', '13A', '0A', 'Am7', 'C major minor']) {
            assert.equal(toCamelotKey(value), null, value);
        }
    });
});

describe('getCamelotKeyColor', () => {
    // Mixxx's "Mixed In Key - Key Colors" palette, in Open Key order (1d = C major = 8B)
    const openKeyPalette = [
        '#F17EDB',
        '#D18BFD',
        '#9EB4FD',
        '#4DD3F8',
        '#01EAEC',
        '#00EECB',
        '#20EF7F',
        '#7FF448',
        '#E0CA6D',
        '#FDA078',
        '#FF8693',
        '#FD7EB3',
    ];

    it('colors both modes of a Camelot number with that number on the Mixxx wheel', () => {
        for (let number = 1; number <= 12; number++) {
            const openKey = ((number + 4) % 12) + 1;
            assert.equal(getCamelotKeyColor(`${number}A`), openKeyPalette[openKey - 1]);
            assert.equal(getCamelotKeyColor(`${number}B`), openKeyPalette[openKey - 1]);
        }
    });

    it('has no color for anything but a normalized Camelot key', () => {
        for (const value of ['', 'Am', '08A', '8a', '13A', 'weird']) {
            assert.equal(getCamelotKeyColor(value), null, value);
        }
    });
});

describe('getSongCamelotKey', () => {
    it('converts the first key tag', () => {
        assert.equal(getSongCamelotKey({ tags: { key: ['Am', 'C'] } }), '8A');
    });

    it('shows a key tag it cannot convert as written', () => {
        assert.equal(getSongCamelotKey({ tags: { key: [' Weird '] } }), 'Weird');
    });

    it('returns null when the song has no usable key tag', () => {
        assert.equal(getSongCamelotKey({ tags: null }), null);
        assert.equal(getSongCamelotKey({ tags: {} }), null);
        assert.equal(getSongCamelotKey({ tags: { key: [] } }), null);
        assert.equal(getSongCamelotKey({ tags: { key: ['  '] } }), null);
    });
});
