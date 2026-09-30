# KatiesAmp automation

KatiesAmp uses four GitHub Actions suites. All build and release automation targets Windows x64.

| Suite | Trigger | Purpose |
| --- | --- | --- |
| Lite | Every push and pull request to `development` | Type checks, linting, styles, and unit tests |
| Full | Pull requests to `development`, release jobs, and manual runs | Lite-equivalent validation, production Electron build, and Electron launch test |
| Release | Manual run from `development` | Full validation followed by a beta or stable Windows x64 GitHub release |
| Nightly | Daily when the repository changed, or manually | Full validation, Windows x64 packaging, packaged-app launch verification, and a retained test artifact |

## Required checks

The protected `development` branch requires both `KatiesAmp Lite` and `KatiesAmp Full`. Pull requests require no approval because this is currently a single-maintainer repository, but conversations must be resolved. Force pushes and branch deletion are disabled.

## Publishing a beta or stable release

1. Merge the intended changes into `development` after Lite and Full pass.
2. Open **Actions > KatiesAmp Release > Run workflow**.
3. Select `beta` or `release`.
4. Optionally enter a base semantic version such as `0.1.4`.

For a beta, the workflow finds the highest existing beta number for the base version and increments it. For a stable release, it publishes the base version without a suffix. Existing releases are preserved.

The workflow builds an NSIS installer, launches the packaged application, checks the update manifest, creates SHA-256 checksums, uploads workflow evidence, and publishes the GitHub release. Beta builds are marked as prereleases.

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
pnpm run package:win
```

The Electron smoke test stores its screenshot under `test-results/electron`. Generated evidence and packaged files are ignored by Git.

## Future end-to-end coverage

The next automation phase should add an isolated Jellyfin fixture and test complete installer and updater behavior. That phase should cover login, playback, downloads, offline playback, queue stress, beta update discovery, installer replacement, and successful restart on the new version.
