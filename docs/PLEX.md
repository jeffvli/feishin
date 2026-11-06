# Plex

## Connect

1. Open **Manage servers**, add a server and select **Plex**.
2. Choose **Sign in with Plex**. Your browser opens automatically; authorize Feishin and return to the app. No IP address, endpoint, username or password is required in Feishin.
3. Feishin discovers the servers available to your account. If there is more than one, choose a server by name. Feishin automatically tries its advertised local, remote and relay connections and checks for an accessible music library before saving the server. This uses Plex's browser/PIN authorization flow (often called Plex OAuth), without handling your Plex password or requiring a redirect URL.
   Alternatively, choose **Or enter a Plex token manually**, enter the Plex Media Server URL (for example `http://192.168.1.10:32400`) and your **X-Plex-Token**, then submit. Do not use `app.plex.tv` or append `/web`. With manual tokens, the username is an optional display label.
4. Select a music library from the server menu, or leave the selection empty to browse all accessible music libraries.

Browser sign-in is also available when editing a server or renewing access. It expires after at most ten minutes and can be cancelled. Changing the server URL or leaving the form stops the pending sign-in. Feishin checks the server identity against your Plex account's resources and uses that server's access token, including for shared servers. The account token is used to query plex.tv and is not stored separately. Only the server access token returned by Plex is saved; Plex may return the same token for an owned server. Server credentials are saved only after the server accepts them.

Server identity checks accept both JSON and XML responses from Plex. The connection phase has a thirty-second overall timeout: if the browser cannot reach a usable server, sign-in is cancelled with an error instead of leaving the connection screen loading indefinitely.

For manual authentication, use a token belonging to the Plex user whose library access, playlists and ratings you want to use. See Plex's [token instructions](https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/). Treat it like a password: Feishin persists the server token with the other server credentials. API requests and cached artwork use authentication headers; playback and download URLs include the token because the media player cannot attach those headers.

For a locked web deployment, set `SERVER_TYPE=plex` and `SERVER_LOCK=true`, optionally with `SERVER_NAME`. Browser sign-in works without `SERVER_URL`; setting it restricts discovery to that server. Manual token login requires a configured URL. Browser deployments need access to plex.tv and a reachable server with compatible HTTPS and CORS settings; Feishin cannot bypass browser mixed-content restrictions.

## Docker: Plex-only same-origin proxy

If Plex returns CORS headers that allow only `https://app.plex.tv`, enable the optional proxy in Feishin's Docker container:

```yaml
environment:
    SERVER_TYPE: "plex"
    SERVER_NAME: "Plex"
    SERVER_LOCK: "true"
    SERVER_URL: "https://music.example.com/plex"
    PLEX_PROXY_URL: "http://plex:32400"
```

- `SERVER_URL` is the browser-visible URL of **Feishin**, followed by `/plex`, not the direct Plex URL. For a local deployment it can be `http://192.168.1.150:9180/plex`. With `PUBLIC_PATH=/music/`, use `https://music.example.com/music/plex`.
- `PLEX_PROXY_URL` is the single Plex origin reachable **from the container**, such as `http://192.168.1.150:32400` or a Docker service hostname. Only HTTP/HTTPS origins are accepted, without credentials, query strings or a path. HTTPS upstream certificates are verified.
- The proxy is disabled by default and is enabled only when `SERVER_TYPE=plex` and `PLEX_PROXY_URL` is a valid origin. Jellyfin, Navidrome and Subsonic clients are unchanged. No destination supplied by a browser request can override the configured upstream.
- Identity discovery, library requests, artwork, playback, downloads and listening reports all use the same-origin URL. Browser/PIN sign-in still contacts plex.tv directly and requires no token in Compose. Sign in again after changing a saved direct server URL to the proxy URL.
- Plex must require token authentication for requests from the Feishin container. Do not add the container's address or Docker subnet to Plex's list of networks allowed without authentication. Except for `/identity`, proxy requests require a token, which Plex validates. Do not expose Plex through this proxy if its authentication is bypassed for the container's IP.
- Proxy request/error logging is disabled to avoid recording playback tokens in URL query strings. If a separate public reverse proxy fronts Feishin, configure that proxy to redact query strings for `/plex/` too. Cookies are not forwarded to Plex.

## Supported

- Artists, albums (including all discs and tracks), songs, genres, search and library selection.
- Server-side pagination, sorting and basic artist, album, genre, favorite and year filters.
- Authenticated artwork, original-file streaming and downloads, and MP3 transcoding at the selected bitrate.
- Music playlist browsing, creation, renaming, deletion, adding, removing and moving individual occurrences of a track.
- Saving a reordered playlist moves existing occurrences instead of replacing them, preserving duplicates and playlist entry IDs. An unchanged order requires no writes.
- Ratings and play-count submissions. Plex has no separate favorite flag: a five-star rating is shown as a favorite. Adding a favorite sets five stars; removing it clears the rating.
- Listening activity in Plex's dashboard: playback start, pause, resume, seek and stop, with timeline updates every ten seconds while playing or paused. Reporting follows Feishin's scrobbling setting and private mode; disabling reporting closes the public session. Play-count submissions remain separate from timeline updates.

## Limitations

- No managed-user switching. Sign in with an account that has access to the library, or supply the appropriate user's token directly.
- Smart playlists can be played, but cannot be edited through the ordinary playlist editor.
- No Plex server queue synchronization, folder browsing, Internet radio storage or recommendation mixes. Local playback queues and external lyric providers continue to work.
- Transcoding currently produces MP3, regardless of the selected codec. Original playback requires a codec supported by the chosen player. Plex's own permissions and subscription requirements still apply.
- Playlist replacement is not atomic: new tracks are appended before old entries are removed. If a request fails, duplicates can remain, but existing tracks are not erased before the additions succeed.
- Playlist reordering is also not atomic: if a move fails, the order may be partially updated, but no tracks are added or removed. Missing playlist entry IDs are rejected before replacement or reordering starts.

## Verification

Run `node scripts/test-plex.mjs` with Node >=22.15 after installing dependencies. It uses a mocked HTTP adapter and checks endpoint-free browser/PIN authorization, discovery, connection fallback, identity validation, HTTPS restrictions, expiration, cancellation, shared-server tokens, normalization, pagination, streaming, artwork and playlist safety.

Run `node scripts/test-plex-playback.mjs` to check the player event wiring with mocked hooks and timers: playback lifecycle, playing/paused heartbeats, seek, repeat, song changes, private mode, disabled scrobbling and existing Jellyfin progress behavior. The API checks above also cover Plex timeline request parameters and timing validation. A live Plex server is still required to verify dashboard activity and server-side listening history.

After building Electron and installing its binary, run `node scripts/test-plex-login-ui.mjs` on Linux for a headless UI check with an isolated profile and mocked Plex responses. It checks the endpoint-free login screen, automatic browser opening, server selection and saved credentials. A live Plex account and server are still needed to verify browser approval, server-version-specific behavior and actual audio playback.

After `pnpm build:web`, run `node scripts/test-plex-login-ui.mjs --web` to check the locked Docker/web login over HTTP, including fallback from an unresponsive connection, XML server identity responses and navigation out of the login screen. Run it again with `--web --timeout` to check that a stalled connection is cancelled without saving credentials and that sign-in becomes available again. Both modes require Electron as a headless browser; `ELECTRON_BINARY` can point to an existing binary.

Use `--web --proxy` to verify same-origin sign-in with Plex responses that advertise the incompatible `https://app.plex.tv` CORS origin. Run `NGINX_BINARY=/path/to/nginx node scripts/test-plex-proxy.mjs` to test the actual nginx template: fixed upstream, authentication forwarding, byte-range streaming, playlist mutations, redirects, subpaths and isolation from other backends.

References: Plex's [authentication guide](https://forums.plex.tv/t/authenticating-with-plex/609370) and the [resources endpoint](https://www.plexopedia.com/plex-media-server/api-plextv/resources/).
