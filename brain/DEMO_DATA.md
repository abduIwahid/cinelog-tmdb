# Demo data — CineLog

- **Setup:** use your own free TMDB Read Access Token (Settings → API). First show the rejected-token path with a garbage string — nothing is saved, error is specific.
- **Trending:** first load shows the skeleton grid, then this week's posters.
- **Search:** `Dune`, `Interstellar`, `Spirited Away`; type fast to show debounce + abort (Network tab: cancelled requests).
- **Genre filter:** load a few pages (scroll), then pick `Science Fiction` — loaded cards filter instantly.
- **Detail:** open a popular movie — cast list + embedded YouTube trailer arrived in ONE request (Network tab).
- **Watchlist:** add two movies, switch to "My watchlist", reload the page — they persist; remove one from inside the detail modal.
- **No-poster movie:** search an obscure title until a card shows the titled placeholder block instead of a broken image.
