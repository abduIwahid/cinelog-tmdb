# CineLog — Movie Finder & Watchlist

> Built by [Abdul Wahid](https://github.com/abduIwahid) — BS Artificial Intelligence student at COMSATS University Islamabad (Attock Campus). One of a series of dependency-free apps I built against free public APIs to practise real-world API constraints: rate limits, caching, and payload normalisation. More at [abdulwahid.me](https://www.abdulwahid.me).


Trending movies, instant search, genre filters, detail views with cast and trailers, and a personal watchlist — all on the TMDB API, all in three static files. The defining design decision: **there is no API token in this project, on purpose.** Every visitor brings their own free TMDB token, which never leaves their browser.

**Live demo:** _TBD — deploy pending owner decision (GitHub Pages or Vercel static)._
Run it locally: open `index.html` in a browser, or `python3 -m http.server` in this folder and visit `http://localhost:8000`.

## Setup — your free TMDB token (one minute)

TMDB requires authentication, so CineLog opens with a setup panel:

1. Create a free account at [themoviedb.org](https://www.themoviedb.org).
2. Go to **Settings → API** and copy the **API Read Access Token** (the long one).
3. Paste it into the app. It is validated with one request, stored **only in your browser's localStorage**, and sent only to `api.themoviedb.org` as an `Authorization: Bearer <token>` header.

No token is hardcoded anywhere in this repository — check for yourself. A wrong token is rejected with a clear message and never saved.

## Features

- **Trending grid** — this week's trending movies with posters, ratings and genre names.
- **Search** — debounced (350 ms) with `AbortController` cancellation of superseded requests.
- **Genre filter chips** — built from TMDB's genre list; the list endpoint returns `genre_ids`, so a local id → name map resolves them on every card.
- **Infinite scroll** — an `IntersectionObserver` sentinel loads the next page before you reach the bottom; it stops at `total_pages` (and at TMDB's hard page cap of 500).
- **Detail modal** — overview, runtime, rating, top 5 cast, and an embedded YouTube trailer when TMDB has one — all from a single request (see below).
- **Watchlist** — add/remove from any card or the detail view; stored in localStorage; a dedicated Watchlist view with genre filtering and a "Top rated" sort toggle. Many-to-many by nature — user ↔ movie — modelled here as a local list of mapped movie objects keyed by TMDB id.
- **Missing posters** render as a titled placeholder block, never a broken image.
- **Full UI states** — setup, skeleton grid, search/genre empty states, empty watchlist state, error with retry, offline banner.

## Engineering decisions

- **Why no bundled token (the security decision).** A token shipped in a static frontend bundle is public — anyone can extract it from DevTools → Network in seconds. Options were: (a) hardcode a token (rejected: credential leak, quota theft), (b) visitor-supplied token in localStorage (chosen: zero server, honest about its model), (c) a serverless proxy (the production upgrade, below).
- **The proxy alternative.** For a public deployment where visitors shouldn't need their own token, put a tiny Vercel/Netlify function in front: it holds the token server-side, forwards only an allowlist of TMDB paths (trending, search, genre, movie detail), and sets `s-maxage` caching so the CDN absorbs repeat traffic and your rate limit survives. That is the documented next step, not a silent omission.
- **`append_to_response` — 3 calls become 1.** The detail view needs credits and videos as well as the movie. TMDB lets you append them to the movie request, so the modal costs one round trip instead of three.
- **Mapper layer.** List payloads (`genre_ids`, `poster_path`, `vote_average`) are normalised into a UI shape once; the genre map joins ids to names; the detail mapper extracts the top-5 cast and finds the first YouTube `Trailer` in the videos list.
- **429 handling.** Bursts can still earn a 429 despite the lack of a daily cap; the error surfaces with guidance instead of failing silently.

## Attribution

**This product uses the TMDB API but is not endorsed or certified by TMDB.**

Data & images: TMDB (themoviedb.org). TMDB's free API is for non-commercial use; commercial use requires separate terms with TMDB. This is a non-commercial portfolio project.

## Trade-offs

- Requiring a visitor token adds one minute of first-run friction — accepted deliberately, because the alternative is publishing a credential.
- Genre filtering applies to movies already loaded (the list endpoints return genre ids inline); loading more pages grows the filtered set. A `/discover` endpoint migration is the Phase 2 route to true server-side genre queries.
- The watchlist is per-browser (localStorage), not synced — a backend watchlist with accounts is Phase 2 work, and the data model (store `tmdb_id`, re-fetch metadata) is designed for it.
