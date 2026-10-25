import { describe, expect, it } from 'vitest';

import { getServerUrl, normalizeServerUrl } from '/@/renderer/utils/normalize-server-url';
import { ServerListItem } from '/@/shared/types/domain-types';

describe('normalizeServerUrl', () => {
    it.each([
        ['http://music.local:4533/', 'http://music.local:4533'],
        ['  https://example.com/navidrome/  ', 'https://example.com/navidrome'],
        ['https://example.com', 'https://example.com'],
    ])('normalizes %j', (url, expected) => {
        expect(normalizeServerUrl(url)).toBe(expected);
    });
});

describe('getServerUrl', () => {
    const server = (fields: Partial<ServerListItem>) =>
        ({ url: 'http://192.168.1.10:4533', ...fields }) as ServerListItem;

    it('returns undefined without a server', () => {
        expect(getServerUrl(null)).toBeUndefined();
        expect(getServerUrl(undefined)).toBeUndefined();
    });

    it('uses the local url by default', () => {
        expect(getServerUrl(server({ remoteUrl: 'https://music.example.com' }))).toBe(
            'http://192.168.1.10:4533',
        );
    });

    it('uses the remote url when preferred or forced', () => {
        const remote = 'https://music.example.com';
        expect(getServerUrl(server({ preferRemoteUrl: true, remoteUrl: remote }))).toBe(remote);
        expect(getServerUrl(server({ remoteUrl: remote }), true)).toBe(remote);
    });

    it('falls back to the local url when there is no remote url', () => {
        expect(getServerUrl(server({ preferRemoteUrl: true }))).toBe('http://192.168.1.10:4533');
        expect(getServerUrl(server({ preferRemoteUrl: true, remoteUrl: '' }), true)).toBe(
            'http://192.168.1.10:4533',
        );
    });
});
