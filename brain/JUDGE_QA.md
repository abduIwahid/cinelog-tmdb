# Interviewer Q&A — CineLog

**Q1. Where is the API token?**
There isn't one in the project — deliberately. A token in a static bundle is public the moment the site deploys; anyone can pull it from DevTools and burn your quota. So each visitor pastes their own free TMDB Read Access Token; it is stored only in their localStorage and sent only to TMDB as a Bearer header. The production alternative is a small serverless proxy that holds the token server-side behind a path allowlist with `s-maxage` caching — that design is written up in the README.

**Q2. How does the detail modal load so much with one request?**
`append_to_response=credits,videos`. TMDB lets you attach sub-resources to the movie call, so overview, cast and trailers arrive together — one round trip instead of three, one failure point, one rate-limit hit.

**Q3. Walk me through the infinite scroll's stopping condition.**
An IntersectionObserver watches a sentinel below the grid with a 400px root margin, so the next page loads just before it is needed. A loading flag prevents concurrent page fetches. It stops when the loaded page reaches `total_pages` from the API — and TMDB hard-caps page at 500 regardless, which the code also respects.

**Q4. The genre names on cards — the list API only returns ids, right?**
Right: list items carry `genre_ids`. I fetch `/genre/movie/list` once, build an id→name Map, and the mapper joins names onto each movie as it is normalised. Same pattern as any foreign-key lookup.

**Q5. How is the watchlist modelled?**
User ↔ movie is many-to-many; with accounts that is a join table storing only `tmdb_id` (metadata re-fetched and cached — you never duplicate TMDB's data). Locally, Phase 1 stores the mapped movie objects in localStorage so the watchlist renders offline; the id-keyed shape migrates directly to the join-table model.
