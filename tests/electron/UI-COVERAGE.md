# KatiesAmp UI automation coverage

The UI suite deliberately separates quick pull request confidence from slower behavioural coverage.

| Area | Smoke | Full | Nightly | Next high-value cases |
| --- | --- | --- | --- | --- |
| Launch and sign-in | App identity, configured server form, successful login | Invalid credentials | Server loss and recovery | Quick Connect |
| Home | Brand, support details, user, version, connected server | Narrow-window layout and music-folder selector | Repeated resize stress | Offline status transition |
| Library | - | Albums, songs, and playlists load from Jellyfin | Large fixture library | Search, sorting, filtering, metadata refresh |
| Playback | - | Volume levelling defaults, profiles, persistence, and Web/MPV availability | Synthetic track starts and requests media | Pause, stop, seek, crossfade, perceptual loudness validation |
| Queue | - | - | Foundation supplied by playback fixture | Manual insertion, skip removal, shuffle order, repeat-all refill |
| Downloads | - | - | Offline download action is available | Progress, cancellation, retry, restoration, sync |
| Product policy | - | Radio and playlist-creation entry points stay hidden | - | Native application-menu restrictions |
| Packaging | - | Production build | Portable launch, NSIS install, installed launch, uninstall | Signed beta-to-beta update replacement |

## Test data rules

- Use only generated audio and fictional metadata.
- Never store a real Jellyfin URL, token, password, or music file in the repository.
- Add mock endpoints only when a KatiesAmp scenario needs them.
- Keep smoke tests under ten seconds on a typical GitHub Windows runner.
- Attach Playwright traces and mock request logs so CI failures can be investigated without reproducing them locally.
