# DnDex 2.0 — implementation and validation

## Confirmed starting defects

The hero was commented out; `debouncedFilters` was a synchronous `useMemo`; campaign covers were ignored; catalogue failures appeared as empty data; several statuses shared incorrect labels; the dashboard nested links; dialogs lacked focus management; mutation errors were swallowed or exposed verbatim; participant subscriptions were duplicated. The README advertised a nonexistent mock provider. SQL allowed self-submitted accepted applications and publicly readable Discord invites, and had no transactional capacity guard. The original lockfile failed `npm ci` with missing peer entries.

## Changes by area

- **Identity and layout:** `src/index.css`, layout components, `HomePage` and `CampaignCover` define the Adventurer’s Codex visual language, original vector artwork and responsive navigation.
- **Discovery:** `CampaignGrid`, `useDebounce`, URL helpers and campaign services provide debounced, cancelable search, filters, result counts, pagination and distinct loading/error/empty states.
- **Adventure dossier:** `CampaignPage`, `CampaignHeader`, `ParticipationPanel`, players and reviews show real availability, all application states, protected Discord access and eligible author controls.
- **Management and forms:** dashboard sections use domain types and real summaries. Campaign/profile forms use shared Zod schemas, explicit error/success feedback and navigation guards. Campaign descriptions have a Markdown preview. Editing checks ownership before rendering and in the service/database.
- **Architecture:** `services/` owns data access and external validation; Query hooks own cache lifecycle; `queryKeys`/`cache` centralize invalidation; `useRealtime` owns one channel and cleans up listeners/timers. Lazy routes split Markdown and forms from the home bundle.
- **Security:** the additive SQL migration protects communication details and pending applications, enforces participant transitions/capacity, preserves owner controls and requires accepted participation for new reviews. A public `campaign_activity` signal replaces participant-row replication so DELETE events cannot expose applicant IDs. The full fresh-install schema includes exactly the same migration.
- **Quality:** strict TypeScript, Vitest/Testing Library and local PostgreSQL policy tests, translation completeness checks and Prettier. Compatible dependency security updates preserve the existing major stack.

## Validation record

Validated on 17 November 2026, with Node 26.13.0 on Windows:

| Check                         | Actual result                                                                                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci --no-fund`            | Passed, clean install from the repaired lockfile                                                                                                         |
| `npm run lint`                | Passed, no lint errors                                                                                                                                   |
| TypeScript                    | Strict mode; passed through `tsc -b` in the production build                                                                                             |
| `npm test`                    | 48 passed in 10 files, including 8 PostgreSQL policy/integrity tests                                                                                     |
| `npm run build`               | Passed; lazy route chunks and a separate Markdown chunk emitted                                                                                          |
| `npm run format:check`        | Passed                                                                                                                                                   |
| `npm audit --audit-level=low` | Passed, 0 vulnerabilities (21 findings at the start)                                                                                                     |
| `git diff --check`            | Passed                                                                                                                                                   |
| Browser                       | Homepage RU/EN, search/filter URL state, browser Back, mobile navigation, native dialog, keyboard tabs, cyclic Tab, Escape and focus restoration checked |
| Responsive layout             | Homepage with expanded filters checked at 320, 375, 768, 1024, 1440 and 1920 px; no horizontal overflow in measured layouts                              |
| Route/error handling          | Invalid campaign ID shows 404; `/create` preserves the route and offers sign-in; missing configuration is explicit                                       |
| Browser console               | No error/warning entries in the final checked session                                                                                                    |
| Lighthouse                    | Not measured; no score claimed                                                                                                                           |

No production Supabase credentials were provided. Live email delivery, authenticated PostgREST writes, signed-in page layouts and hosted Realtime must be checked on staging. The local SQL tests exercise PostgreSQL policies and triggers, rather than claiming a successful remote deployment. PGlite does not reproduce simultaneous independent database connections. The build emits a Node 26 `module.register()` deprecation notice from the toolchain; checks still exit successfully.

## Practical limits and remaining work

1. Apply the versioned migration before shipping the frontend, configure Supabase Auth URLs/email and enable the three Realtime tables.
2. Run the player/GM/review journeys against staging with separate accounts and simultaneous requests for the last seat. Verify private fields through both REST and Realtime.
3. Measure Lighthouse against the production build with realistic campaign data and representative devices. No Lighthouse score is claimed here.
4. For very large catalogues, consider a trigram/search index after measuring real queries. The public catalogue is paginated; per-user dashboard lists are currently complete rather than independently paginated.
5. Optionally self-host fonts, add user-owned cover uploads with Storage RLS, and configure a privacy-aware error reporter when those operational needs exist.
