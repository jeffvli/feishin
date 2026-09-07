# API

Server library data layer (Jellyfin / Navidrome / Subsonic). Read when adding or changing fetches, mutations, normalize, or query keys.

## Layers

| Layer | Path | Job |
|-------|------|-----|
| Feature queries / mutations | `src/renderer/features/<feature>/api/`, `.../mutations/` | `queryOptions` / `useMutation`; call `api.controller` |
| Facade | `src/renderer/api` → `controller.ts` | Pick backend from current server (`ServerType`) |
| Backend client + controller | `src/renderer/api/{jellyfin,navidrome,subsonic}/` | HTTP + map to controller endpoints |
| Types + normalize | `src/shared/api/{jellyfin,navidrome,subsonic}/` | Zod/types + `*Normalize` → domain |
| Domain contracts | `src/shared/types/domain-types.ts` | `ControllerEndpoint` shapes features rely on |
| Query keys | `src/renderer/api/query-keys.ts` | `[serverId, resource, …]`; use `splitPaginatedQuery` for list/count |

React Query client: `src/renderer/lib/react-query.ts`.

## Add a query

1. Prefer extending the matching `src/renderer/features/<feature>/api/*-api.ts` (or add one beside siblings).
2. Call `api.controller.<method>(…)` — do not invent one-off axios/fetch in UI.
3. Keys from `queryKeys` — keep `serverId` first; invalidate the same keys from mutations.
4. UI uses `useQuery(<feature>Queries.…)` like nearby features.

```ts
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
```

## Normalize / new endpoint

- Wire through the per-backend **controller**, not the feature component.
- Parse/validate with shared types; map with `jfNormalize` / `ndNormalize` / `ssNormalize` in `src/shared/api/...`.
- Keep domain types stable for features; backend quirks stay in normalize/controller.

## Upstream OpenAPI (last resort)

Do **not** fetch these for ordinary API work. Prefer in-repo controllers, `src/shared/api/*-types.ts`, normalize, and existing call sites.

Fetch **only** when an endpoint, field, or auth detail is missing or contradictory in-repo and you cannot finish without the vendor contract:

| Backend | Schema |
|---------|--------|
| OpenSubsonic (Subsonic / Navidrome-compatible) | https://opensubsonic.netlify.app/docs/openapi/openapi.json |
| Navidrome native API | https://github.com/navidrome/navidrome/tree/master/server/nativeapi |
| Jellyfin | https://api.jellyfin.org/openapi/jellyfin-openapi-stable.json |

When you must open one: pull **only the path/operation/schema (or Go handler file) you need**, not the whole spec or folder into context. Then encode the result in our types/normalize/controller — do not leave features depending on the remote source.

## Don’t

- Bypass `api.controller` from feature UI.
- Put Jellyfin/Navidrome/Subsonic response shapes in React components — normalize first.
- Hand-roll query key arrays when `query-keys.ts` already has a factory.
- Open upstream OpenAPI “just in case” or to explore — in-repo code first.
