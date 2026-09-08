# Mantine

Feishin wraps the Mantine components and hooks it uses under `src/shared/components/` and `src/shared/hooks/`. Feature code imports those wrappers (`/@/shared/...`), not `@mantine/*`.

## Default (most UI work)

1. Import from `/@/shared/components/...` and `/@/shared/hooks/...`.
2. Match callers and props already in use — the wrapper is the API.
3. Do **not** fetch Mantine LLM docs, MCP, or upstream skills.

`@mantine/*` belongs only inside the wrapper modules (and a few shared theme/type utilities).

## When to open upstream docs

Reach for live Mantine docs **only** if you are:

- **Debugging a wrapper** — behavior/bug lives in `src/shared/components/*` or `src/shared/hooks/*` (or adjacent shared Mantine adapters), or
- **Adding a new wrapped** component or hook — introducing a new `/@/shared/...` re-export that did not exist.

Then:

1. Confirm **Mantine v9** in `package.json`.
2. Prefer **Mantine MCP** if configured (`search_docs`, `get_item_doc`, `get_item_props`); else https://mantine.dev/llms.txt → the linked per-page `.md` for that item only.
3. Do not vendor `llms-full.txt`.

## Skill branches (new wrappers only)

Install from [mantinedev/skills](https://github.com/mantinedev/skills) only when scaffolding a matching new wrapper:

| New wrapper kind | Skill |
|------------------|--------|
| `@mantine/form` / validation / form context | `mantine-form` |
| Custom select via `Combobox` | `mantine-combobox` |
| Factory + Styles API component | `mantine-custom-components` |

## Repo theme notes

User-loadable desktop theme JSON and `mantineOverride`: `docs/CUSTOM_THEMES.md` — only when changing that behavior or theme-object shape.
