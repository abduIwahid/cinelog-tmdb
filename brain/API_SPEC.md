# API spec — TMDB API v3 (https://api.themoviedb.org/3)

Auth: `Authorization: Bearer <Read Access Token>` on every request. Token is the visitor's own (free at themoviedb.org → Settings → API), stored only in their localStorage. Limits: no daily cap; soft ceiling ~50 requests/second; bursts can return 429 (handled). Free use is non-commercial and requires attribution.

| Endpoint | Used for | Response fields consumed |
|---|---|---|
| `GET /genre/movie/list` | Token validation + genre map/chips | `genres[].id`, `genres[].name` |
| `GET /trending/movie/week?page=N` | Default grid | `results[]` (see movie fields), `page`, `total_pages` |
| `GET /search/movie?query={q}&page=N` | Search grid | same as trending |
| `GET /movie/{id}?append_to_response=credits,videos` | Detail modal — ONE request | `title`, `release_date`, `vote_average`, `poster_path`, `overview`, `runtime`, `genres[].name`, `credits.cast[]` (`name`, `character`, ordered by billing), `videos.results[]` (`site`, `type`, `key`) |

**Movie list fields:** `id`, `title`, `release_date`, `vote_average`, `poster_path` (nullable → placeholder; full URL = `https://image.tmdb.org/t/p/w500` + path), `genre_ids[]` (ids only — names joined via the genre map), `overview`.

**Rules honoured in code:**
- `page` never exceeds `total_pages`, and never 500 (TMDB's hard cap).
- Trailer selection: first video with `site == "YouTube"` and `type == "Trailer"`; embedded via youtube-nocookie-style iframe URL on youtube.com.
- Attribution is mandatory and verbatim in the footer + README: "This product uses the TMDB API but is not endorsed or certified by TMDB."

**Verification note:** TMDB cannot be called without a token, and no token may be committed or fabricated for testing. Code paths were verified by careful re-reading against TMDB's documented response shapes (2026-11-10); first live verification happens at the owner's first run with their own token (Phase 3 checklist in BUILD_PLAN).
