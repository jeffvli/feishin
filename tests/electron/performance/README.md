# KatiesAmp performance automation

The performance suite measures the complete Electron process tree reported by `app.getAppMetrics()`. Every scenario attaches a JSON report and an HTML memory chart to its Playwright result.

## Automated gates

- Pull requests run the development startup and idle-resource gate through `pnpm run test:ui`.
- Nightly automation loads a generated 10,000-track library and runs a 20-minute playback and navigation soak.
- Nightly and Release automation rerun the startup and idle gate against `dist/win-unpacked/KatiesAmp.exe`.
- The existing UI evidence uploads retain the reports under `test-results/electron`.

## Default budgets

| Measurement                 | Default budget | Environment variable                    |
| --------------------------- | -------------: | --------------------------------------- |
| Startup to DOM-ready window |     20 seconds | `KATIESAMP_PERF_MAX_STARTUP_MS`         |
| Idle working set            |         850 MB | `KATIESAMP_PERF_MAX_IDLE_MEMORY_MB`     |
| Idle private memory         |         600 MB | `KATIESAMP_PERF_MAX_IDLE_PRIVATE_MB`    |
| Idle average CPU            |            25% | `KATIESAMP_PERF_MAX_IDLE_CPU_PERCENT`   |
| Electron process count      |             18 | `KATIESAMP_PERF_MAX_PROCESS_COUNT`      |
| 10,000-track load           |     30 seconds | `KATIESAMP_PERF_MAX_LIBRARY_LOAD_MS`    |
| 10,000-track working set    |       1,100 MB | `KATIESAMP_PERF_MAX_LIBRARY_MEMORY_MB`  |
| 10,000-track private memory |         750 MB | `KATIESAMP_PERF_MAX_LIBRARY_PRIVATE_MB` |
| Soak working set            |       1,000 MB | `KATIESAMP_PERF_MAX_SOAK_MEMORY_MB`     |
| Soak private memory         |         700 MB | `KATIESAMP_PERF_MAX_SOAK_PRIVATE_MB`    |
| Soak average CPU            |            35% | `KATIESAMP_PERF_MAX_SOAK_CPU_PERCENT`   |
| Soak memory growth          |         160 MB | `KATIESAMP_PERF_MAX_SOAK_GROWTH_MB`     |

The nightly duration is controlled by `KATIESAMP_PERF_SOAK_MINUTES`. The workflow sets it to 20 minutes; local runs default to two minutes.

Working-set totals include memory shared between Electron processes, so private-memory limits provide the stricter ownership check. These limits are deliberately broad enough for variable GitHub-hosted Windows runners while still catching runaway CPU, unbounded memory growth, excessive subprocess creation, and major startup regressions. Tighten them only after comparing a useful history of retained reports.
