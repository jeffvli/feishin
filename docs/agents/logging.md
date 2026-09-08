# Logging

Use the process logger for diagnosable failures and meaningful state transitions. Skip noise (render churn, routine success paths, prop dumps).

## Which logger

| Process | Import | API |
|---------|--------|-----|
| Renderer / remote | `import { logger } from '/@/renderer/utils/logger'` | `logger.debug\|info\|warn\|error(message, meta?)` |
| Main | `import log from '/@/main/logger'` | `log.debug\|info\|warn\|error(...)` |

Do not use bare `console.*` for new logging in app code — the loggers format, debounce (renderer), forward to electron-log / files, and respect the configured level.

## When to log

Add a log when the code path is hard to reconstruct from the UI alone:

- Failures and catch blocks that would otherwise vanish (`error` / `warn`)
- Engine / connection / auth / playback transitions that change behavior (`info` or `debug`)
- Fallback paths (e.g. playback engine fell back to web) (`warn` / `info`)

Skip: hot loops, every React render, expected empty states, data the user already sees as a toast unless the log adds process-side detail.

## Levels

Configured threshold is `debug` | `info` (`LogLevel` in `/@/shared/logger/types`). Message severity is `debug` | `info` | `warn` | `error`.

| Severity | Use for |
|----------|---------|
| `error` | Failed operation; include the error in `meta` or args |
| `warn` | Degraded / unexpected but continuing |
| `info` | Notable lifecycle (engine chosen, reconnect, update check) |
| `debug` | Detail useful when digging (payload shapes, step traces) — gated off unless level is `debug` |

## Message shape

- First arg: short human message string.
- Optional second arg (renderer): structured `meta` object — prefer `{ error, … }` over string-concatenating errors.
- No secrets: passwords, tokens, full auth headers, or anything `sanitize-for-diagnostics` would strip from exports. Main diagnostic packaging uses `/@/shared/utils/sanitize-for-diagnostics` — keep ad-hoc logs equally clean.
