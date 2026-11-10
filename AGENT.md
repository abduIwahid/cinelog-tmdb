# CineLog — agent entry
Summary: Static movie finder + watchlist on TMDB. Visitor-supplied Read Access Token (localStorage only, Bearer header), trending/search with infinite scroll, genre chips, detail modal via append_to_response. Vanilla HTML/CSS/JS, no build step.
Core feature: A complete TMDB client that ships zero credentials — the token is the visitor's, entered at runtime.
Read first: `brain/00-START-HERE.md`, then `brain/PRD.md` and `brain/ARCHITECTURE.md`.
Hard rules: design tokens only (see brain/DESIGN.md); NEVER hardcode a TMDB token anywhere, including examples; the footer attribution "This product uses the TMDB API but is not endorsed or certified by TMDB." must never be removed; every change is logged in `brain/changes/` (changelog + session file).
Commands: open `index.html`, or `python3 -m http.server` then visit http://localhost:8000 . Syntax check: `node --check app.js`.
