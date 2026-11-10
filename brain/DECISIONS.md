# Decisions — CineLog

## ADR-1 — Vanilla JS, no build step (2026-11-10)
The app is an API client with local state; a framework would not remove the genuinely hard parts (token lifecycle, pagination termination, genre joining) and would hide them from a code-reading interviewer.

## ADR-2 — Key strategy: visitor's own token, runtime entry, localStorage only (2026-11-10)
Options: (a) hardcode the owner's token — rejected: it is a published credential; anyone can extract it from the bundle/Network tab and burn the quota; (b) visitor token — chosen: zero server, each user on their own quota, nothing to leak because the repo holds nothing; (c) serverless proxy — documented in the README as the production upgrade (path allowlist + s-maxage caching). The accepted cost is one minute of first-run setup, mitigated by step-by-step panel copy.

## ADR-3 — Detail view via append_to_response (2026-11-10)
One request (`/movie/{id}?append_to_response=credits,videos`) instead of three sequential ones: less latency, fewer rate-limit hits, atomic failure. The mapper splits the combined payload.

## ADR-4 — Caching strategy: watchlist only, no response cache (2026-11-10)
Trending/search data is volatile (weekly trending, changing ratings), so response caching would serve stale rankings; the state that must persist is the user's watchlist, stored as mapped movie objects so it renders offline. Genre list is fetched once per session and held in a Map.
