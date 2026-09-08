# Frontend

Conventions for UI in the renderer: imports, composition, CSS Modules, theme tokens, i18n, icons, toasts, modals, Zustand state.

## Imports

| Use | Path |
|-----|------|
| Shared UI / hooks / theme | `/@/shared/...` → `src/shared/...` |
| Features / layouts / stores | `/@/renderer/...` → `src/renderer/...` |
| i18n | `/@/i18n/...` or `react-i18next` / `i18next` as nearby files do |

Deep imports only — no component barrels. Example: `/@/shared/components/button/button`.

**Mantine:** feature UI imports wrappers under `/@/shared/components` and `/@/shared/hooks`, not `@mantine/core`. Open `docs/agents/mantine.md` only when debugging those wrappers or adding a new one.

**Exception:** `@mantine/modals` (`openModal`, `openContextModal`, `closeModal`, …) is the usual imperative API in features — match nearby callers.

## Composition ladder

1. **Shared wrapper** — `/@/shared/components/...` (design-system primitive).
2. **Feature-shared** — `src/renderer/features/shared/components/` (domain chrome reused across features).
3. **Feature-local** — `src/renderer/features/<feature>/components/` (one feature only).

Layout primitives: `Box`, `Flex`, `Stack`, `Group`, `Grid` from `/@/shared/components/...`. Prefer them over one-off layout divs when composing screens.

Put a new primitive in shared only when it is generic design-system; otherwise keep it feature-local or feature-shared.

## CSS Modules

- Co-locate `component-name.module.css` next to `component-name.tsx` (kebab folder + file names).
- Class names in CSS are kebab-case; Vite maps them to camelCase on `styles` (`.player-button` → `styles.playerButton`).
- Compose classes with `clsx`. On Mantine wrappers, pass module classes through the Styles API (`classNames={{ root: styles.root, ... }}`).
- Colors, spacing, chrome: prefer `var(--theme-…)` / `var(--theme-colors-…)` over raw hex or `--mantine-*` so custom themes keep working.
- PostCSS: `@mixin light-root` / `dark-root` where light/dark splits belong; `lighten` / `darken` / `alpha` are allowed by stylelint.

Global CSS is rare (`src/shared/styles/global.css` and third-party/theme overrides) — don’t add feature styles there.

## Theme tokens

| Layer | Source |
|-------|--------|
| Types / shape | `src/shared/themes/app-theme-types.ts` |
| Built-in themes | `src/shared/themes/*`, registry `app-theme.ts` |
| Runtime CSS variables | injected as `--theme-*` / `--theme-colors-*` (see `use-app-theme`) |
| Mantine theme object | `src/renderer/themes/mantine-theme.tsx` |
| Bridge to Mantine vars | `src/shared/styles/global.css` |

User-loadable desktop theme JSON (`colors` / `app` / `mantineOverride` / `stylesheets`): `docs/CUSTOM_THEMES.md` — only when changing that surface.

## i18n, icons, toasts, modals

- **Copy:** `useTranslation` / `t`; keys in `src/i18n/locales/en.json` (`common.*`, `form.*`, `error.*`, `page.*`, `entity.*`, …). Add keys next to existing namespaces.
- **Icons:** `<Icon icon="…" />` from `/@/shared/components/icon/icon`. New glyphs go on the `AppIcon` map there — don’t import `react-icons` / Lucide directly in features.
- **Toasts:** `toast.success|error|info|warn({ message, title? })` from `/@/shared/components/toast/toast`.
- **Modals:** open/close via `@mantine/modals`; render with shared `Modal` / `ModalButton` / provider patterns already in tree. Controlled visibility often uses `/@/shared/hooks/use-disclosure`.

## State (Zustand)

| Scope | Where |
|-------|--------|
| App-wide | `src/renderer/store/` — auth, settings, player, app chrome, etc. Prefer the barrel `src/renderer/store` when the store is re-exported; otherwise deep-import the `*.store.ts` file (e.g. `custom-themes.store.ts`). |
| Feature | `src/renderer/features/<feature>/store/` (or a hook-colocated store) when state is feature-owned |
| Remote SPA | `src/remote/store` — remote session / WebSocket only; not the library `api.controller` |

Patterns to match nearby stores:

- Prefer `createWithEqualityFn` from `zustand/traditional`.
- Persisted app stores often use `persist` + `immer` (+ `devtools` / `subscribeWithSelector` when siblings do).
- Multi-field reads: `useShallow` or the store’s exported selector hooks; see `src/renderer/lib/zustand.ts` (`createSelectors`) where used.
- Don’t duplicate player/auth/settings into a new global store — extend the existing one or keep a feature-local store.
