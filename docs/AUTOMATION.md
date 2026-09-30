# KatiesAmp automation

KatiesAmp uses four main GitHub Actions suites plus a weekly Jellyfin compatibility check. All build and release automation targets Windows x64.

| Suite | Trigger | Purpose |
| --- | --- | --- |
| Lite | Every push and pull request to `development` | Type checks, linting, styles, and unit tests |
| Full | Pull requests to `development`, release jobs, and manual runs | Lite-equivalent validation, production Electron build, and tagged Electron UI tests |
| Release | Manual run from `development` | Full validation followed by a beta or stable Windows x64 GitHub release |
| Nightly | Daily when the repository changed, or manually | Full validation, extended UI tests, Windows x64 packaging, installer lifecycle validation, and retained evidence |
| Jellyfin Contract | Weekly or manually | Starts a temporary current Jellyfin container on a GitHub runner and checks the public API contract |

## Required checks

The protected `development` branch requires both `KatiesAmp Lite` and `KatiesAmp Full`. Pull requests require no approval because this is currently a single-maintainer repository, but conversations must be resolved. Force pushes and branch deletion are disabled.

## Publishing a beta or stable release

1. Merge the intended changes into `development` after Lite and Full pass.
2. Open **Actions > KatiesAmp Release > Run workflow**.
3. Select `beta` or `release`.
4. Optionally enter a base semantic version such as `0.1.4`.

For a beta, the workflow finds the highest existing beta number for the base version and increments it. For a stable release, it publishes the base version without a suffix. Existing releases are preserved.

The workflow builds an NSIS installer, launches the packaged application, checks the update manifest, performs a silent install and uninstall cycle, creates SHA-256 checksums, uploads workflow evidence, and publishes the GitHub release. Beta builds are marked as prereleases.

## Windows signing

The release workflow supports these optional repository secrets:

- `WIN_CSC_LINK`
- `WIN_CSC_KEY_PASSWORD`

When valid signing credentials are configured, electron-builder signs the executable and installer. Without them, the workflow can still produce an unsigned test release.

## Local validation

```powershell
pnpm install --frozen-lockfile
pnpm run lint
pnpm test
pnpm run build:electron
pnpm run test:electron
pnpm run test:ui
pnpm run test:ui:nightly
pnpm run package:win
```

Playwright stores HTML reports, screenshots, traces, renderer errors, and the mock Jellyfin request log under `test-results/electron`. Generated evidence and packaged files are ignored by Git.

## UI test environment

Electron tests use a local mock Jellyfin server with synthetic metadata and a generated WAV file. No personal server address, credentials, music, or internet connection is required. Every test gets a separate KatiesAmp profile, and the profile is deleted afterward.

Tests are tagged by cost:

- `@smoke` checks launch, clean-profile sign-in, and the branded home screen.
- `@full` adds invalid login, responsive layout, folder selection, albums, songs, playlists, and product restrictions.
- `@nightly` covers playback and offline-download entry points and is intended for longer queue, shuffle, repeat, crossfade, and recovery scenarios.

The weekly contract job complements the mock by running a fresh Jellyfin container on GitHub infrastructure. It catches upstream API shape changes without requiring a spare server at home.

## Remaining update coverage

Packaging, update-manifest presence, portable packaged launch, silent installation, installed launch, and uninstallation are automated. A true update replacement test still needs two signed, published versions because `electron-updater` must download an older-to-newer release transition. Add that as a post-release test once Windows code signing is configured so it represents the production update path accurately.
