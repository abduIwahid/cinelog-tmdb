# Design — CineLog

**Direction:** cinema ink (near-black) header on warm paper, one accent (projector red). Posters provide all the colour; the chrome stays monochrome. Solid colours only.

**Tokens (as used in styles.css):**
- `--bg: #F7F4EE` · `--surface: #FFFFFF` · `--surface-alt: #EEE9DD`
- `--ink: #14161A` · `--text: #1C1C1C` · `--text-on-ink: #F2EFE6`
- `--text-muted: #5E5A4F` · `--border: #D8D2C0`
- `--accent: #C0392B` · `--accent-dark: #8E2718` · `--star: #9A6B00`
- `--danger: #B3261E` · `--focus: #1A56C4` · `--radius: 10px`

**Typography:** system stack — "Helvetica Neue", Helvetica, Arial, sans-serif. Posters are strict 2:3; titles never overlay images.

**Component states:**
- Setup panel: bordered, numbered instructions, inline error line for a rejected token (nothing saved on failure).
- View toggle: segmented control, `aria-pressed` marks All vs Watchlist.
- Genre chips: same pattern as the other projects' filters (pressed = inverted).
- Card: poster button (opens detail) + watchlist button with two labelled states ("+ Watchlist" / "In watchlist ✓") — state is text, never colour alone.
- Skeleton cards while the first page loads; empty states for search, genre and watchlist; error state with retry; end-of-results note when pagination terminates; offline banner.

**Responsive:** grid `minmax(160px, 1fr)` (140px on small phones); detail modal collapses to one column under 560px.
