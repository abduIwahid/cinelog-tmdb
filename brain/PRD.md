# PRD — CineLog

**Core feature (one sentence):** Browse trending movies, search TMDB's catalogue, open rich detail views (cast + trailer in one request) and keep a local watchlist — powered entirely by the visitor's own free TMDB token, with zero credentials in the codebase.

**Problem:** TMDB demos on GitHub routinely ship with the author's token committed in the source — a leaked credential anyone can scrape. They also tend to fire three requests per detail view, page with "load more" buttons, and break on movies with no poster. CineLog is built to be the counterexample on all three.

**Target user:** Recruiters and interviewers (who will need the one-minute token setup — the setup panel is written for them, step by step); movie fans using it as an actual watchlist tool.

## Scope
**MUST** — first-run setup panel with token validation; trending grid; debounced search with AbortController; genre chips from the genre list with id→name mapping; detail modal via `append_to_response=credits,videos` (top-5 cast, YouTube trailer embed); poster placeholder for null `poster_path`; watchlist (localStorage) with All/Watchlist views; IntersectionObserver infinite scroll stopping at `total_pages`/500; mandatory TMDB attribution in footer; loading/error/empty/offline states.
**SHOULD** — server-side genre filtering via `/discover`; "where to watch" providers. (Phase 2, not built yet.)
**COULD** — account-backed synced watchlist (login + backend); serverless token proxy. (Stretch — proxy documented in README.)

## Success criteria
- `grep -r "Bearer " ` finds only the header construction reading from localStorage — no literal token anywhere in the repo.
- Opening a movie detail costs exactly one TMDB request.
- A visitor with a fresh browser goes from landing to browsing in about a minute, guided only by the setup panel.
