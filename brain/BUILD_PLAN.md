# Build plan — CineLog

- [ ] **Phase 0 — Repo + empty deploy** (pending owner: create GitHub repo, choose GitHub Pages or Vercel)
- [x] **Phase 1 — MVP** (2026-11-10): setup panel with token validation, trending grid, debounced search + AbortController, genre chips (id→name map), detail modal via append_to_response (cast + trailer), poster placeholders, watchlist (localStorage, All/Watchlist views), IntersectionObserver infinite scroll (stops at total_pages/500), mandatory attribution, loading/error/empty/offline states.
- [ ] **Phase 2 — Level-ups from the guide (not built yet):**
  - [ ] Server-side genre filtering via /discover
  - [ ] "Where to watch" via watch/providers
  - [ ] Login + backend watchlist (store tmdb_id only; metadata re-fetched)
- [ ] **Stretch (not planned):** serverless token proxy (allowlist + s-maxage caching) so visitors need no token
- [ ] **Phase 3 — Deploy + first live verification + README demo GIF** (pending owner). First live run checklist: valid token accepted, invalid token rejected cleanly, trending loads, search + infinite scroll, detail modal with trailer, watchlist persists across reload.
