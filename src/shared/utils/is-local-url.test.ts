import { describe, expect, it } from 'vitest';

import { isLocalUrl } from '/@/shared/utils/is-local-url';

describe('isLocalUrl', () => {
    it.each([
        'http://localhost:4533',
        'http://127.0.0.1',
        'http://127.1.2.3',
        'http://[::1]:8096',
        'http://0.0.0.0',
        'http://nas.local',
        'http://10.0.0.5',
        'http://192.168.1.10:4533',
        'http://169.254.0.1',
        'http://172.16.0.1',
        'http://172.31.255.255',
        'http://[fd12:3456::1]',
        'http://[fc00::1]',
        'http://[fe80::1]',
    ])('treats %s as local', (url) => {
        expect(isLocalUrl(url)).toBe(true);
    });

    it.each([
        'https://music.example.com',
        'http://8.8.8.8',
        'http://172.15.0.1',
        'http://172.32.0.1',
        'http://192.169.0.1',
        'http://[2001:db8::1]',
        // Regression: domains starting with an IPv6 local prefix were treated as local
        'https://fdroid.org',
        'https://fc-example.com',
        'https://fe80example.net',
        'not a url',
        '',
    ])('treats %s as remote', (url) => {
        expect(isLocalUrl(url)).toBe(false);
    });
});
