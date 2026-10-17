# KatiesAmp UI automation coverage

The UI suite deliberately separates quick pull request confidence from slower behavioural coverage.

| Area | Smoke | Full | Nightly | Next high-value cases |
| --- | --- | --- | --- | --- |
| Launch and sign-in | App identity, configured server form, successful login | Invalid credentials | - | Server loss and recovery, Quick Connect |
| Home | Brand, support details, user, version, connected server | Narrow-window layout, music-folder selector, live permission refresh, ready-update installation action | - | Repeated resize stress, offline status transition |
| Library | - | Albums, songs, and playlists load from Jellyfin; clean-install navigation and Album, Artist, and Track content columns | A generated 10,000-track library loads within its time and memory budgets | Search, sorting, filtering, metadata refresh |
| Playback | - | Volume levelling defaults, profiles, persistence, Web/MPV availability, live crossfade duration changes, and manual Fade to next overlap/queue advancement | Synthetic playback plus measured Web Audio levelling, limiting, and crossfade output | Real MPV output measurement and perceptual loudness comparison |
| Queue | - | Clean-install side-queue columns and fullscreen queue default and toggle | Skip removal, later-track selection, visible shuffle order, repeat-off stop, repeat-all or shuffled refill before track end, and server-deleted track pruning | Exact drag position in the rendered virtual queue and crossfade plus refill in one scenario |
| Downloads | - | - | Actions and icons, live progress, cancellation, retry, application restart restoration, playlist synchronization, server-deletion reconciliation, and playback after server loss | Interrupted-download resume |
| Product policy | - | Radio, playlist-creation, and legacy Auto DJ entry points stay hidden | - | Native application-menu restrictions |
| Packaging and updates | - | Production build | Portable launch, NSIS install, installed launch, uninstall | Signed `electron-updater` transport and install against a temporary release feed |
| Performance | - | Development startup, idle CPU, memory, and process-count budgets | Twenty-minute playback/navigation soak, memory-growth guard, large-library load, and packaged Windows startup/idle budgets | Real MPV child-process metrics and hardware-specific baselines |

The release workflow also unit-tests beta and stable version resolution and verifies that the current Windows beta installer replaces the previous beta successfully. The weekly Jellyfin contract workflow uses a disposable Jellyfin 10.10.7 container and generated audio to check startup, authentication, permissions, music folders, albums, artists, search, playlists, and ranged playback.

## Test data rules

- Use only generated audio and fictional metadata.
- Never store a real Jellyfin URL, token, password, or music file in the repository.
- Add mock endpoints only when a KatiesAmp scenario needs them.
- Keep smoke tests under ten seconds on a typical GitHub Windows runner.
- Attach Playwright traces and mock request logs so CI failures can be investigated without reproducing them locally.

## Tracked follow-up gaps

- Add a rendered exact-position drag test for the virtual queue. Queue insertion itself is covered by deterministic unit tests for top, bottom, multiple-item, stale-target, and search-result insertion.
- Measure real MPV output on a runner with MPV available; current MPV coverage checks filter construction while live output measurement uses Web Audio.
- Exercise a complete signed `electron-updater` beta-to-beta download and apply cycle. The release workflow currently verifies beta installer replacement without a live update feed.
- Add interrupted-download resume coverage.
- Add true mobile-layout coverage, repeated resize stress, and native application-menu policy checks.
