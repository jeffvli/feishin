import { describe, expect, it } from 'vitest';

import {
    findExistingServerLockServer,
    normalizeServerUrl,
} from '/@/renderer/features/action-required/utils/server-lock';
import { ServerListItemWithCredential } from '/@/shared/types/domain-types';
import { ServerType } from '/@/shared/types/types';

const server = (id: string, url: string, type = ServerType.NAVIDROME) =>
    ({ id, type, url }) as ServerListItemWithCredential;

describe('normalizeServerUrl', () => {
    it('trims whitespace and a trailing slash', () => {
        expect(normalizeServerUrl('  http://music.lan:4533/  ')).toBe('http://music.lan:4533');
    });
});

describe('findExistingServerLockServer', () => {
    const nd = server('nd', 'http://music.lan:4533/');
    const jf = server('jf', 'http://jellyfin.lan', ServerType.JELLYFIN);

    it('returns nothing when no servers are saved', () => {
        expect(findExistingServerLockServer({}, 'http://music.lan:4533')).toBeUndefined();
    });

    it('matches the configured URL ignoring a trailing slash', () => {
        expect(findExistingServerLockServer({ jf, nd }, ' http://music.lan:4533 ')).toBe(nd);
    });

    it('reuses the only saved server when the configured URL changed', () => {
        expect(findExistingServerLockServer({ nd }, 'http://new-host:4533')).toBe(nd);
    });

    it('falls back to the server type when several servers are saved', () => {
        expect(findExistingServerLockServer({ jf, nd }, 'http://other', ServerType.JELLYFIN)).toBe(
            jf,
        );
        expect(findExistingServerLockServer({ jf, nd }, 'http://other')).toBeUndefined();
    });
});
