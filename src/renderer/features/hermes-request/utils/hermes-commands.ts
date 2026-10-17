// Hermes Music's slash commands, typed into Sour Player's Request music box. They do exactly what they
// do on the Hermes Music page; each command writes lines to `say` as it goes.

export type Say = (text: string, kind?: 'error' | 'info' | 'ok') => void;

interface Issue {
    artist: string;
    file: string;
    problems: string[];
    title: string;
}

let lastIssues: Issue[] = [];

export const COMMAND_HELP = [
    'song name - request one song (add the artist for best results)',
    '/album NAME - a whole album',
    '/artist NAME - an artist (their newest releases)',
    '/karaoke SONG - the instrumental, for karaoke in the Sour Stage',
    'a Spotify, YouTube or YouTube Music link - a song, album or whole playlist',
    'a Spotify profile or YouTube channel link - all its public playlists',
    '/now NUMBER - move that queue number to the front',
    '/bump NAME - push something already queued to the front',
    '/queue - queue counts',
    '/yes, /no - answer "Is this the song?"',
    '/follow ARTIST, /unfollow ARTIST, /following - new releases download by themselves',
    '/video SONG - find a music video (also /video list, /video wrong SONG, /video remove SONG)',
    '/duplicate - find copies of the same song (then /duplicate confirm PIN)',
    '/rescan - re-read the music folder now',
    '/issues - songs with missing tags, no cover or low quality (then /fix N or /upgrade N)',
    '/fix-all - fix every song with missing or junk tags or no cover',
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const isCommand = (text: string) => /^\/\w/.test(text.trim());

// commands that are really requests with a type
export const requestCommand = (text: string) => {
    const m = text.trim().match(/^\/(album|artist|karaoke)\b\s*(.*)$/i);
    return m ? { query: m[2].trim(), type: m[1].toLowerCase() as 'album' | 'artist' | 'karaoke' } : null;
};

export const runHermesCommand = async (url: string, text: string, say: Say) => {
    const api = async <T>(path: string, body?: unknown): Promise<T> => {
        const res = await fetch(`${url}/${path}`, {
            ...(body === undefined
                ? {}
                : {
                      body: JSON.stringify(body),
                      headers: { 'content-type': 'application/json' },
                      method: 'POST',
                  }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || `Hermes Music returned ${res.status}`);
        return json as T;
    };
    const [command, ...args] = text.trim().split(/\s+/);
    const name = command.toLowerCase();
    const rest = args.join(' ');
    try {
        switch (name) {
            case '/bump': {
                const r = await api<{ count: number; name: string }>('api/bump', { text: rest });
                say(`${r.name} moved to the front${r.count > 1 ? ` (${r.count} songs)` : ''}`, 'ok');
                return;
            }
            case '/dup':
            case '/duplicate':
            case '/duplicates': {
                if (args[0]?.toLowerCase() === 'confirm') {
                    const r = await api<{ failed?: string[]; moved: number }>('api/duplicates/remove', {
                        currentPin: args[1] || '',
                    });
                    say(`${r.moved} file${r.moved === 1 ? '' : 's'} moved to music/.duplicates`, 'ok');
                    return;
                }
                say('checking the whole library for copies... this can take a minute');
                const r = await api<{
                    files: number;
                    groups: number;
                    list: { keep: { path: string }; remove: { path: string }[] }[];
                }>('api/duplicates/scan', {});
                if (!r.groups) {
                    say('no duplicates found', 'ok');
                    return;
                }
                for (const g of r.list.slice(0, 15)) {
                    say(`keep ${g.keep.path}`);
                    for (const x of g.remove) say(`  remove ${x.path}`);
                }
                say(`${r.groups} songs have copies, ${r.files} files would be removed. To remove them: /duplicate confirm PIN`, 'ok');
                return;
            }
            case '/fix':
            case '/upgrade': {
                const n = Number.parseInt(args[0], 10);
                const it = lastIssues[n - 1];
                if (!it) {
                    say('run /issues first, then /fix NUMBER', 'error');
                    return;
                }
                say(`${name === '/fix' ? 're-tagging' : 'downloading a better copy of'} ${it.title || it.file}...`);
                const r = await api<{ artist: string; title: string }>('api/library/fix', {
                    action: name === '/fix' ? 'retag' : 'upgrade',
                    file: it.file,
                });
                say(`fixed: ${r.artist} - ${r.title}`, 'ok');
                return;
            }
            case '/fix-all': {
                await api('api/library/fix-all', {});
                say('checking every song, then fixing tags, artists, albums and covers...');
                for (;;) {
                    await sleep(3000);
                    const r = await api<{ done: number; failed: number; fixed: number; running: boolean; total: number }>(
                        'api/library/fix-all',
                    );
                    if (!r.running) {
                        say(
                            r.total
                                ? `${r.fixed} fixed${r.failed ? `, ${r.failed} couldn't be matched (rename them "Artist - Title")` : ''}`
                                : 'nothing needed fixing',
                            'ok',
                        );
                        return;
                    }
                }
            }
            case '/follow': {
                if (!rest) throw new Error('type an artist, e.g. /follow the killers');
                const r = await api<{ artist: string }>('api/follows', { artist: rest });
                say(`following ${r.artist} - new releases download by themselves`, 'ok');
                return;
            }
            case '/following': {
                const list = await api<{ artist: string; by: string }[]>('api/follows');
                if (!list.length) say('not following anyone - /follow ARTIST');
                for (const f of list) say(`${f.artist} (by ${f.by})`);
                return;
            }
            case '/h':
            case '/help':
                COMMAND_HELP.forEach((line) => say(line));
                return;
            case '/issues': {
                await api('api/library/issues', {});
                say('checking every song (a few minutes on a big library)...');
                let r: { list: Issue[]; running: boolean; total: number };
                do {
                    await sleep(2000);
                    r = await api('api/library/issues');
                } while (r.running);
                lastIssues = r.list;
                if (!r.list.length) {
                    say(`no problems found in ${r.total} songs`, 'ok');
                    return;
                }
                r.list.slice(0, 40).forEach((x, i) =>
                    say(`${i + 1}. ${x.artist ? `${x.artist} - ` : ''}${x.title || x.file} (${x.problems.join(', ')})`),
                );
                say(`${r.list.length} songs need attention: /fix N re-tags one, /upgrade N gets a better copy, /fix-all fixes them all`, 'ok');
                return;
            }
            case '/no':
            case '/yes': {
                const list = await api<{ id: string; status: string }[]>('api/requests');
                const q = list.find((r) => r.status === 'ask');
                if (!q) {
                    say('nothing is waiting for an answer');
                    return;
                }
                const r = await api<{ next?: { artist: string; title: string }; queued?: boolean }>(
                    `api/requests/${q.id}/answer`,
                    { yes: name === '/yes' },
                );
                if (r.queued) say('downloading it', 'ok');
                else if (r.next) say(`Is this the song? ${r.next.title} - ${r.next.artist} (/yes or /no)`);
                else say('no more guesses - try again with the artist name');
                return;
            }
            case '/now': {
                const r = await api<{ count: number; name: string; pos: number }>('api/now', {
                    pos: Number.parseInt(args[0], 10),
                });
                say(`#${r.pos} ${r.name} is next`, 'ok');
                return;
            }
            case '/queue': {
                const s = await api<{ done: number; pending: number; working: number }>('api/status');
                say(`${s.pending} waiting, ${s.working} downloading, ${s.done} added`);
                return;
            }
            case '/rescan': {
                const r = await api<{ message?: string; started?: boolean }>('api/library/rescan', {});
                say(r.started ? 'rescanning the music folder' : r.message || 'already scanning', 'ok');
                return;
            }
            case '/unfollow': {
                if (!rest) throw new Error('type an artist, e.g. /unfollow the killers');
                await api('api/follows', { remove: rest });
                say(`stopped following ${rest}`, 'ok');
                return;
            }
            case '/video':
            case '/videos': {
                if (!rest || rest.toLowerCase() === 'list') {
                    const list = await api<{ artist: string; song: string; videoId: string }[]>('api/videos');
                    if (!list.length) say('no music videos yet - add one with /video SONG');
                    list.forEach((x) => say(`${x.artist} - ${x.song} (youtu.be/${x.videoId})`));
                    return;
                }
                if (/^wrong\s+/i.test(rest)) {
                    const r = await api<{ artist: string; removed?: boolean; song: string }>('api/videos/wrong', {
                        query: rest.replace(/^wrong\s+/i, ''),
                    });
                    say(r.removed ? `no other video matches ${r.song}, so it was removed` : `trying the next video for ${r.song}`, 'ok');
                    return;
                }
                if (/^remove\s+/i.test(rest)) {
                    const r = await api<{ artist: string; song: string }>('api/videos/remove', {
                        query: rest.replace(/^remove\s+/i, ''),
                    });
                    say(`removed the music video for ${r.artist} - ${r.song}`, 'ok');
                    return;
                }
                say('looking for the official music video...');
                const r = await api<{ artist: string; song: string; title: string }>('api/videos', { query: rest });
                say(`${r.artist} - ${r.song} now has a music video: ${r.title}`, 'ok');
                return;
            }
            default:
                say(`unknown command ${command} - type /help`, 'error');
        }
    } catch (error) {
        say((error as Error).message, 'error');
    }
};
