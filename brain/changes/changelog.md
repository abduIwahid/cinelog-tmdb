# Changelog — CineLog

Format: Change → Reason → Affected Area → Impact → Status.

## 2026-11-10 — Project initialized + Phase 1 MVP built
- **Change:** Created the full static app (index.html, styles.css, app.js), README, AGENT.md, comment-only .env.example and this brain.
- **Reason:** Portfolio project #3 from the "5 Free APIs → 5 Portfolio Projects" guide; demonstrates Bearer-token hygiene (visitor-supplied, never hardcoded), append_to_response, and observer-driven pagination on the TMDB API.
- **Affected Area:** Entire repo (new).
- **Impact:** Complete movie finder + watchlist runs from static files once a visitor supplies a token; not yet deployed.
- **Status:** Verified by code review — `node --check app.js` passes; all TMDB request paths, field reads and the attribution text re-read against the documented API contract. Live verification requires a real visitor token and is scheduled as the Phase 3 first-run checklist (no token may be fabricated or committed for testing).

- **Change:** Watchlist "Top rated" sort toggle (rating kept numerically in the mapper; sort applies to the watchlist view only) → **Reason:** owner asked for the repos to look genuinely worked on; a saved list you cannot order is a demo, not a tool → **Affected Area:** `app.js`, `index.html` → **Status:** Verified locally (node --check; sort logic exercised on synthetic payloads).
- **Change:** Mapper now preserves `genreIds` on both list and detail mappings → **Reason:** watchlist genre filtering silently never matched movies saved from the detail view, whose mapping lacked genre ids → **Affected Area:** `app.js` → **Status:** Verified locally.
- **Change:** First-person About section in the app + README author byline and sort feature entry → **Reason:** the repo should read as its author's own project → **Affected Area:** `index.html`, `styles.css`, `README.md` → **Status:** Verified locally.
