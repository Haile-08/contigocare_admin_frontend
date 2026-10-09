# karai.health Admin — Frontend

React 19 + TypeScript + Vite SPA for the karai.health admin API. State is managed
with **Redux Toolkit**; **RTK Query** is the only way the app talks to the
network.

```bash
npm install
cp .env.example .env.local     # adjust VITE_DEV_PROXY_TARGET if needed
npm run dev                    # http://localhost:3000
```

The backend must be running (default `http://localhost:8000`). The dev server
proxies `/api` to it, so the browser only ever calls its own origin.

| Command                 | What it does                                |
| ----------------------- | ------------------------------------------- |
| `npm run dev`           | Dev server with HMR                         |
| `npm run build`         | Typecheck, then production build to `dist/`  |
| `npm run typecheck`     | `tsc -b`                                    |
| `npm run lint`          | oxlint                                      |
| `npm test`              | Vitest (single run)                         |
| `npm run test:coverage` | Vitest with V8 coverage                     |
| `npm run verify`        | typecheck + lint + test — run before pushing |

---

## Layout

Three layers, and imports only ever point **downwards**: `app → features → shared`.
A feature never imports another feature's internals, and `shared` never imports
a feature. `import/no-cycle` is a lint error, so a violation fails CI rather
than quietly becoming load-order spaghetti.

```
src/
├── index.css              Design foundation — every colour token lives here
├── app/                   Composition root — nothing reusable lives here
│   ├── App.tsx            Store + router + top-level error boundary
│   ├── layouts/           RootLayout, AuthLayout, AppLayout (shell), ChatLayout
│   │                      + Sidebar, Topbar, Breadcrumbs, Page
│   ├── router/            Route table, path helpers, auth guards
│   └── store/             configureStore, root reducer, typed hooks, listeners
│
├── features/              One folder per domain capability
│   ├── auth/              login, registration, credential lifecycle
│   ├── sessions/          conversation list, create / rename / delete
│   ├── chat/              messages, streaming, composer
│   ├── dashboard/         derived metrics, KPI tiles, chart, ops rail
│   └── ui/                theme, language + chrome preferences (nav rail, ops rail)
│       ├── api/           RTK Query endpoints injected into the base API
│       ├── model/         slices, types, zod schemas, validation
│       ├── lib/           feature-local helpers
│       └── ui/            components for this feature only
│
├── pages/                 Thin route components that compose features
├── shared/                Cross-cutting, domain-agnostic
│   ├── api/               baseApi, baseQuery, auth scopes, error normalising
│   ├── config/            validated environment, navigation data
│   ├── i18n/              English + Spanish dictionaries, `t`, locale context
│   ├── lib/               cn, format, storage, logger, jwt, form helpers
│   └── ui/                Button, Field, Card, Badge, Icon, BrandMark, …
└── test/                  setup + `renderWithProviders`
```

**Adding a feature**: create the folder, inject its endpoints into `baseApi`,
add its slice to `rootReducer`, add its route to the router. Nothing else in
the codebase needs to change.

---

## Design system

The console is one flat plane: white surfaces, a single hairline instead of a
shadow, dense small type, and the mark's green (`public/icon.svg`, `#10B981`)
as the only accent. Green is reserved for meaning — the active nav item, the
primary action, the focus ring, the chart's line — so nothing competes with it.

Every colour, radius and shell dimension is a token in `src/index.css`, declared
in Tailwind's `@theme` so it becomes a real utility (`bg-surface`, `text-muted`,
`border-line`). Components reference the token, never a hex value: re-skinning
the console is an edit to that one file. Dark mode is a second block of the same
token names, selected by `data-theme="dark"` on `<html>` and written by the ui
slice, so an explicit choice always beats the OS setting.

Three rules keep it consistent:

- **Icons come from the registry** (`shared/ui/Icon`), never inline SVG — one
  stroke weight across the whole app.
- **`cn()` merges classes** (clsx + tailwind-merge), so a `className` at the
  call site overrides a primitive's own utility instead of fighting it.
- **The brand mark is inlined** (`shared/ui/BrandMark`) and painted from tokens,
  which is what lets it stay green and legible on every surface in both themes.

---

## Languages

The console ships English and Spanish. `shared/i18n/en.ts` is the source of
truth; `es.ts` is typed against it, so **a key added without a translation is a
build error** rather than an English string leaking into a Spanish screen.

```tsx
const { t, fmt } = useTranslation()

t('sessions.rename', { name })              // "Renombrar Triaje"
t('opsRail.messageCount', { count: 1 })     // "1 mensaje" — `count` picks the form
fmt.number(1234)                            // "1.234" in es, "1,234" in en
```

The chosen locale lives in the ui slice beside the theme, is persisted, and is
published to the tree through a context in `shared/i18n` — that indirection is
what lets `shared/ui` translate without importing the store. On a first visit
the language follows the browser (the theme does not); an explicit choice always
wins afterwards. The ui listener writes the BCP-47 tag to `<html lang>`, which
is what picks a screen reader's voice and the browser's hyphenation dictionary.

Both dictionaries ship in one chunk, so switching language is instant and has no
loading state. What is *not* translated is text the server wrote: a FastAPI
`detail` passes through verbatim, since replacing a specific explanation with a
generic translated one would be a downgrade. Our own messages carry a
`messageKey` out of `normalizeApiError` and are translated at the call site.

---

## The dashboard

The API has no metrics endpoint, so `features/dashboard` derives its figures
from the two endpoints that do exist — the session list, and each session's
transcript. Every number on the screen is counted from real messages; none of
it is stubbed.

That costs one request per conversation, so the screen reads only the most
recent *N* (the sample chip in the header, mirrored in the URL) and says so on
the page. It gets at the data by dispatching the existing `listSessions` and
`getMessages` endpoints rather than issuing its own requests, so the
session-scoped tokens are attached exactly as the chat feature attaches them,
a 401 on one transcript stays scoped to that session, and the transcripts land
in the cache entries the chat screen reads — opening a conversation from the
dashboard is instant.

Recharts is loaded with `React.lazy` and only by the chart card, so it stays
out of every other route's bundle.

---

## State: what goes where

Most "state management" problems are really a filing problem. Four buckets:

| Kind of state           | Where it lives                     | Example                    |
| ----------------------- | ---------------------------------- | -------------------------- |
| Server data             | RTK Query cache                    | sessions, messages         |
| Global client state     | A Redux slice                      | credentials, unsent drafts |
| Navigation state        | The URL                            | which session is open      |
| Ephemeral view state    | `useState` in the component        | "renaming this row"        |

Server data is **never** copied into a slice. Anything derived from a request
stays in the query cache, where invalidation and refetching already work.

### Redux Toolkit

- `combineSlices(authSlice, chatSlice, baseApi)` — adding a slice is one line.
- `makeStore()` is a **factory**; tests build isolated stores instead of sharing
  a singleton.
- Slice-colocated selectors (`authSlice.selectors`) — no `RootState` import,
  no selector file to keep in sync.
- Side effects (persisting credentials, resetting the cache on sign-out) live
  in **listener middleware**, not in components or reducers.
- Typed hooks in `app/store/hooks.ts`. Use `useAppSelector` / `useAppDispatch`,
  never the bare react-redux ones.

### RTK Query

One API slice (`shared/api/baseApi.ts`) with **no endpoints of its own**. Each
feature injects its own via `injectEndpoints`, so the API layer grows sideways
rather than turning into one long file — and cross-feature invalidation still
works because there is a single cache and a single set of tags
(`Session`, `Messages`).

Patterns worth knowing about here:

- **Two token scopes.** The API issues a *user* token (login) and a *session*
  token per conversation. `extraOptions.authScope` says which a given endpoint
  needs; `withSessionToken(token)` attaches a specific session's token, which
  rename and delete require because the backend rejects any other session's.
- **Response validation.** Every response is parsed with zod in
  `transformResponse` and mapped from the API's `snake_case` to camelCase
  domain types. A backend change fails loudly at the boundary instead of
  surfacing as `undefined` inside a component.
- **Stable cache keys.** `GET /auth/sessions` mints a *fresh* session token on
  every call, so `getMessages` overrides `serializeQueryArgs` to key on
  `sessionId` alone — otherwise every sessions refetch would orphan the message
  cache.
- **Optimistic updates** with rollback on rename, clear-history, and the
  streaming send.
- **Bounded retries** for idempotent GETs on transient failures (network,
  timeout, 502/503/504), with exponential backoff and jitter. Mutations never
  auto-retry; 429 never retries, because the API rate-limits deliberately.
- **Streaming into the cache.** `fetchBaseQuery` only resolves once a body is
  complete, so `streamMessage` uses a custom `queryFn` for the SSE endpoint —
  but it writes chunks straight into the `getMessages` cache entry via
  `updateQueryData`. The UI reads one source of truth and owns no streaming
  state of its own. Chunks are batched (~60 ms) so a long reply costs a handful
  of renders, not hundreds.

---

## Security

The security boundary is the **API**, which validates a JWT on every request.
Everything below is defence in depth on the client.

- **Token storage.** Only the *user* token is persisted, and by default into
  `sessionStorage` — tab-scoped and dropped when the tab closes. `localStorage`
  is deliberately not an option. Session tokens are re-issued by
  `GET /auth/sessions` on load, so they are never written down.
  Set `VITE_TOKEN_STORAGE=memory` to persist nothing at all (a reload then
  signs the user out).
  **The real fix is server-side**: have the API set an `HttpOnly`, `Secure`,
  `SameSite=Strict` cookie, which puts the token out of JavaScript's reach
  entirely. `features/auth/lib/tokenStorage.ts` is the only file that would
  change.
- **Sign-out wipes the cache.** `baseApi.util.resetApiState()` runs on logout
  and on an expired token, so the next person to sign in on that tab cannot see
  the previous account's data.
- **One place handles 401.** The base query turns it into an app-wide event; a
  401 from *login* is correctly treated as "wrong password", not an expiry.
- **No open redirect.** The post-login "return to" path is rejected unless it is
  an in-app path.
- **DevTools off in production** — they expose the entire store, tokens included.
- **Errors are normalised** before display, so raw server strings and stack
  traces do not reach the UI.
- **Route guards are UX, not enforcement.** They keep a signed-out user off a
  page that could only fail; they are not what protects data.
- **No `dangerouslySetInnerHTML`** anywhere — assistant output renders as text.
  `react/no-danger` is a lint error, so it stays that way.

### Deployment headers

Serve `dist/` behind a reverse proxy that sets, at minimum:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'
Strict-Transport-Security: max-age=63072000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

`style-src 'unsafe-inline'` is required by Tailwind's runtime style injection.
Keep `connect-src 'self'` by proxying the API under the same origin — which is
also what removes the need for permissive CORS.

---

## Conventions

- **TypeScript is strict**, plus `noUncheckedIndexedAccess` and
  `noPropertyAccessFromIndexSignature`. `any` is a lint error.
- **Environment access goes through `shared/config/env.ts`**, which validates it
  at startup. Never read `import.meta.env` anywhere else.
- **Logging goes through `shared/lib/logger.ts`**, never `console` directly —
  debug/info are dropped in production, and this is the seam where Sentry would
  be wired in.
- **Route paths come from `app/router/paths.ts`**, not string literals.
- **Accessibility is built into the primitives**: `Field` wires
  `aria-invalid` / `aria-describedby`, `Alert` picks `alert` vs `status`, the
  message list is a polite live region.
- **Route-level code splitting** via `lazy` — the login screen does not ship the
  chat feature.

## Tests

Vitest + Testing Library, with `renderWithProviders` mounting a real store and
router — tests exercise the actual reducers and middleware, so they fail when
the wiring breaks. Covered today: the auth reducer's session lifecycle, API
error normalisation, and the login form end to end (validation, a rejected
sign-in, and a successful one landing in the store).
