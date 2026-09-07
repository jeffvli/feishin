# Commits

Conventional Commits for history that can feed release notes and scoped changelogs. Enforced by commitlint (`commitlint.config.mjs`) and the Test workflow.

Automatic Weblate translation commits (subject `Translated using Weblate`) are skipped via the config's `ignores` list, since they do not follow the conventional format.

## Format

```
type(scope): subject

[optional body]

[optional footer]
```

Examples:

- `feat(player): add MPV reload control`
- `fix(window): restore minimized window`
- `chore(deps): bump electron`
- `feat!: drop legacy auth path` or footer `BREAKING CHANGE: …`

## Types

Use the conventional set (from `@commitlint/config-conventional`):

`feat` · `fix` · `perf` · `refactor` · `docs` · `style` · `test` · `build` · `ci` · `chore` · `revert`

Prefer `feat` / `fix` / `perf` for user-facing notes; keep chore/build/ci out of highlight sections when generating notes.

## Scopes

Scope = product area a release-note reader cares about — not Electron process (`main` / `preload`) and not “settings” (scope the feature the setting belongs to).

Scope is optional. When present, it must be one of (see `commitlint.config.mjs` — source of truth):

### Product

| Scope | Use for |
|-------|---------|
| `player` | Queue, engines, mpv/web, playerbar, now-playing playback (any process) |
| `radio` | Radio stations / radio playback |
| `lyrics` | Lyrics fetch, display, lyrics-specific options |
| `library` | Albums, artists, songs, folders, genres, favorites, search, playlists |
| `servers` | Server list, login, connection |
| `remote` | Remote-control SPA and remote server |
| `theme` | Themes, CSS variables, custom themes |
| `ui` | Pages, styling, and shared UI with no single feature owner |
| `visualizer` | Butterchurn / audio-motion visualizers |
| `window` | Titlebar, minimize/restore, fullscreen chrome |
| `sharing` | Shares |
| `tag-editor` | Tag editing |

### Meta

| Scope | Use for |
|-------|---------|
| `api` | Multi-backend controller / normalize / query keys with no single feature owner |
| `i18n` | Locales / Weblate |
| `ci` | GitHub Actions / workflows |
| `deps` | Dependency bumps |
| `release` | Versioning, changelogs, publish / packaging config |

Add a new scope in `commitlint.config.mjs` first, then document it here.

## Subject

- Imperative, present tense (“add”, not “added”)
- No trailing period
- Do not put agent attribution in the message (see `AGENTS.md`)

## Local check

```bash
pnpm exec commitlint --last
# or
echo "feat(player): your subject" | pnpm exec commitlint
```

CI runs commitlint over the PR or push range (see `.github/workflows/test.yml`).
