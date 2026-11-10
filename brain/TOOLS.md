# Tools — CineLog

**API: TMDB** — free Read Access Token (account + Settings → API). Documented limits: no daily cap, soft ceiling ~50 req/s, 429 possible on bursts. Free use is non-commercial; attribution (logo/notice) is mandatory — the text notice is implemented in footer + README.

**Hosting plan:** static files only — GitHub Pages or Vercel static. **TBD by owner** (no repo/deployment created yet). The README documents the optional serverless-proxy upgrade for a token-free public deployment.

**Fallback if the API is down:** watchlist (localStorage) remains fully usable offline; browsing surfaces the error state with retry. There is no alternate movie database wired in.

**Accounts needed:** a free TMDB account — the visitor's own, by design.
