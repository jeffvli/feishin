import { MbUrlRel } from '/@/renderer/features/context-menu/api/musicbrainz-links';

/**
 * A MusicBrainz relationship's `type` (e.g. "streaming music", "free streaming") never says
 * which service it points to, only what kind of link it is. Service identity comes from the
 * URL's own host instead.
 */
export type ExternalService = 'deezer' | 'qobuz' | 'spotify' | 'tidal' | 'youtube';

/** Declaration order is display order: most to least likely to actually be linked. */
const SERVICE_HOST_PATTERNS: Array<[ExternalService, RegExp]> = [
    ['spotify', /open\.spotify\.com/],
    ['deezer', /(?:www\.)?deezer\.com/],
    ['tidal', /(?:listen\.)?tidal\.com/],
    ['qobuz', /(?:open|play|www)\.qobuz\.com/],
    ['youtube', /(?:music\.)?youtube\.com/],
];

/**
 * Sniffs known streaming services out of a MusicBrainz recording/release/artist's url-rels.
 *
 * Never fabricates an entry: a service only appears here when one of its rels actually resolved,
 * so callers can render exactly what MusicBrainz has and nothing more.
 */
export function matchExternalLinks(rels: MbUrlRel[]): Partial<Record<ExternalService, string>> {
    const matched: Partial<Record<ExternalService, string>> = {};

    for (const [service, pattern] of SERVICE_HOST_PATTERNS) {
        const rel = rels.find((candidate) => pattern.test(candidate.url));
        if (rel) {
            matched[service] = rel.url;
        }
    }

    return matched;
}
