# Draft pages — content preview via shared link

## Goal

Let editors mark individual markdown pages in `apps/web/src/content/` as drafts so they are invisible to the public (404, hidden from listings, hidden from search) but viewable by anyone holding a shared preview link.

This supports gradual content rollout: pages can sit in the repo while under review, then go live by flipping a single frontmatter field.

## Approach

**Per-page draft flag in frontmatter (`draft: true`), enforced at the loader/server layer, gated by a signed cookie set via a shared secret.**

- Frontmatter gains `draft?: boolean` (default `false` = published).
- A `/preview` route accepts `?token=<shared-secret>` and, on match, sets a signed `HttpOnly` cookie; `?exit=1` clears it.
- Loaders and search read the cookie and include drafts only when it's present and valid.
- When a non-preview visitor hits a draft URL directly, the route throws `notFound()` and the existing 404 page renders.

**Soft hide, not hard hide.** Drafts continue to be bundled into the client JS via the existing `import.meta.glob` in `content/registry.ts`. They are filtered at every surface that exposes them (route loader, category listings, services page, search). A determined visitor inspecting the JS bundle could find draft text. This is acceptable for review of work-in-progress public-information pages; it is **not** suitable for genuinely embargoed or sensitive content. If that need ever arises, we switch to a hard-hide model (separate build, drafts excluded at bundle time).

### Alternatives considered

- **Hard hide via separate build / Vite plugin** — drafts excluded from the public bundle. Rejected: forces preview to be a separate deploy, which breaks the "share a link on the live site" model and adds CI complexity. Revisit only if content sensitivity demands it.
- **Per-recipient signed tokens (HMAC of identifier + expiry)** — supports revocation per reviewer and visibility into who used preview. Rejected for v1 in favour of a single shared secret. Easy to layer on later without changing the cookie shape.
- **Client-side dual search index** — ship both a public and a full MiniSearch index, choose at query time. Rejected: bloats every public client with draft text indexed and ready, and still requires exposing the preview signal to the client. Moving `search` to a server function is cleaner and removes the index from the public client entirely.

## Scope

- Extend `FrontmatterSchema` with `draft?: boolean`.
- Surface `draft` on the resolved `Frontmatter` and on `ContentPage` from the registry.
- Add a `lib/preview.ts` helper that:
  - Reads the preview cookie from the current request.
  - Signs / verifies the cookie using `PREVIEW_SECRET` (HMAC-SHA256).
  - Exposes a single `isPreview(request)` function for loaders / server functions.
- Add a `lib/visible-pages.ts` (or equivalent helper on the registry) that returns `PAGES` filtered by preview state. Every consumer goes through this helper rather than touching `PAGES` directly.
- Add a `/preview` route:
  - `GET /preview?token=<secret>` — validates against `PREVIEW_SECRET`, sets signed cookie, 302s to `/`.
  - `GET /preview?exit=1` — clears the cookie, 302s to `/`.
  - Invalid / missing token → 404 (do not reveal that the route exists meaningfully).
- Update the catch-all `$.tsx` route:
  - For page lookups: drafts return `notFound()` for non-preview requests.
  - For category listings: filter `PAGES` through the visibility helper.
- Update `services.tsx` (services listing) to filter through the visibility helper.
- Move search to a server function:
  - `lib/search.ts` builds the index from `PAGES` (unchanged), but `search()` becomes a `createServerFn` that filters results by preview state per-request.
  - `routes/search-results.tsx` calls the server function from its loader.
- Document `PREVIEW_SECRET` in `.env.example` (and equivalents). Generate value via `openssl rand -hex 32`.

### Out of scope

- Per-recipient tokens, expiry per reviewer, audit logging.
- Hard-hide / bundle exclusion.
- Hiding draft pages from `/sitemap.xml` (no sitemap exists yet; when added, it must consult the visibility helper).
- Any UI affordance to indicate preview mode is active to the previewer.

## Files

**New**
- `apps/web/src/lib/preview.ts` — cookie sign / verify, `isPreview(request)`, cookie name + options.
- `apps/web/src/lib/visible-pages.ts` — `getVisiblePages(isPreview)` and any small helpers built on it (e.g. `findVisiblePage`). Consumers import from here, not from `content/registry.ts`.
- `apps/web/src/routes/preview.tsx` — enter/exit route.
- `apps/web/src/lib/preview.test.ts` — unit tests for sign/verify and the visibility helper.

**Modified**
- `apps/web/src/lib/frontmatter.ts` — add `draft: z.boolean().optional()`; thread through resolved `Frontmatter`.
- `apps/web/src/content/registry.ts` — surface `draft` on `ContentPage` (passthrough; no filtering here).
- `apps/web/src/routes/$.tsx` — call `isPreview` from the loader; use visibility helper for both page lookup and category listing.
- `apps/web/src/routes/services.tsx` — use visibility helper.
- `apps/web/src/lib/search.ts` — convert exported `search` to a `createServerFn` (instrumented per `apps/web/.cursorrules`); index builds from full `PAGES`, filters at query time using `isPreview`.
- `apps/web/src/routes/search-results.tsx` — call search via loader/server function instead of synchronously in the component.
- `apps/web/.env.example` (create if missing) — document `PREVIEW_SECRET`.
- `apps/web/README.md` — short section: how editors mark drafts, how reviewers use the preview link.

## Verify

- **Unit**: `preview.test.ts` covers cookie sign/verify (valid, tampered, missing, wrong secret); visibility helper covers draft inclusion/exclusion.
- **Manual**:
  - Mark one existing page `draft: true`; confirm:
    - Direct URL returns 404 for a fresh browser session.
    - Page is absent from its category listing and from `/services`.
    - Page is absent from `/search-results` for a query that would otherwise match it.
  - Hit `/preview?token=<PREVIEW_SECRET>`; redirect to `/`; repeat the three checks — page is now visible everywhere.
  - Hit `/preview?exit=1`; page disappears again.
  - Hit `/preview?token=wrong` — 404; cookie not set.
  - Tamper with the cookie value in devtools — drafts hidden again on next request.
- **Type / lint**: `pnpm --filter web typecheck && pnpm --filter web lint`.
- **No regression**: existing pages (no `draft` field) remain visible without the cookie.

## Open questions

- **Cookie name** — proposed `gov_preview`. Any naming convention to match?
- **Search copy on the existing client component** — once `search` becomes async via a server function, `search-results.tsx` shifts to reading hits from the loader. Confirm no UX change beyond the source of `hits`.
- **`.env.example`** — does the project already have one I missed? If yes, append rather than create.
- **Sitemap** — none today; when one is added, wire it through the visibility helper. Worth a follow-up note in the README so it's not forgotten.
