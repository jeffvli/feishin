## General guidelines

- Never use the em dash "—". Use plain dash "-" instead.
- On an explicit commit request: `git add` the changes, run `pnpm lint:staged`, then commit. It lints only staged TS/TSX/CSS/SCSS via eslint+stylelint and auto-fixes; typecheck runs in CI (`test.yml`), not locally. Do not stage or run it outside a commit request.

## Agent skills

### Issue tracker

Issues live as markdown under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.

### Architecture

Process boundaries (main / preload / renderer / remote / web, `window.api`, import rules): read `docs/agents/architecture.md` when crossing processes or builds.

### API

Server library data layer (controller, query keys, normalize): read `docs/agents/api.md` when adding or changing fetches, mutations, or backend mapping. Upstream OpenAPI links inside that doc — fetch only as a last resort when in-repo types/controllers are insufficient.

### Mantine

Wrapped UI lives under `/@/shared/components` and `/@/shared/hooks`. Read `docs/agents/mantine.md` only when debugging those wrappers or adding a new wrapped component/hook.

### Frontend

Renderer UI (imports, composition, CSS Modules, theme, i18n/icons/toasts/modals, Zustand): read `docs/agents/frontend.md` when writing or changing frontend UI, styles, or client state.

### Logging

App logging (renderer `logger` / main `log`): read `docs/agents/logging.md` when adding or changing diagnosable code paths — failures, fallbacks, engine/connection lifecycle.

### Commits

Conventional Commits + allowed scopes: read `docs/agents/commits.md` when writing a commit message. Enforced by commitlint in CI.

## Working mode

Ponytail (lazy senior / YAGNI ladder) on coding tasks. See the `ponytail` skill.
