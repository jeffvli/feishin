# Architecture

Process and build boundaries. Read when work crosses main / preload / renderer / remote / web, or touches `window.api` / IPC.

## Layout

| Tree | Role |
|------|------|
| `src/main` | Electron main: window lifecycle, OS features, core IPC (player, remote server, themes, lyrics, …) |
| `src/preload` | `contextBridge` → `window.api` (`src/preload/index.ts`) |
| `src/renderer` | Full app UI (Electron renderer + web build root) |
| `src/remote` | Remote-control SPA, served by the Electron remote feature |
| `src/shared` | Cross-process UI, types, normalize, themes, utils — no process-specific imports |
| `src/i18n` | Locales + i18n setup |

## Builds

| Target | Command / config | Notes |
|--------|------------------|--------|
| Electron | `pnpm dev` / `build:electron` (`electron.vite.config.ts`) | main + preload + renderer |
| Web | `pnpm build:web` (`web.vite.config.ts`) | `out/web`; Docker uses this |
| Remote | `pnpm build:remote` (`remote.vite.config.ts`) | `out/remote` |
| Default package | `pnpm build` | electron + remote |

Desktop-only surfaces (custom themes, mpv, MPRIS, many `window.api.*` modules) must gate on `isElectron()` and null-check `window.api`. See `docs/CUSTOM_THEMES.md` for themes.

## Aliases

| Alias | → |
|-------|---|
| `/@/main` | `src/main` (Electron main; not in web/remote vite) |
| `/@/preload` | `src/preload` |
| `/@/renderer` | `src/renderer` |
| `/@/shared` | `src/shared` |
| `/@/i18n` | `src/i18n` |
| `/@/remote` | `src/remote` |

## Import boundaries (culture — not ESLint)

- **main** → `/@/main`, `/@/shared` only.
- **preload** → preload + shared (plus the existing relative main env exception).
- **shared** → no `/@/renderer`, `/@/main`, `/@/remote`, `/@/preload`.
- **renderer** → `/@/renderer`, `/@/shared`, `/@/i18n` — not `/@/main`.
- **remote** → `/@/remote`, `/@/shared`; may reuse selected `/@/renderer` utilities (theme, logger) — do not grow that into a full renderer dependency.

Electron capabilities from the UI: `window.api.*` (typed in `src/preload/index.d.ts`), never direct main imports.

## Related

- UI / CSS / i18n patterns: `docs/agents/frontend.md`
- Server library API: `docs/agents/api.md`
- Logging: `docs/agents/logging.md`
