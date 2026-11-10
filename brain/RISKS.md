# Risks — CineLog

1. **Key exposure (the project's central risk)** → No key exists in the repo; the visitor's token lives only in their localStorage and travels only to api.themoviedb.org over HTTPS. The setup copy states this plainly so users can make an informed choice.
2. **First-run friction** (visitor needs a TMDB account) → Setup panel is three numbered steps with the exact menu path; token validated immediately with specific failure copy. The proxy route is documented for a future friction-free deployment.
3. **429 bursts during infinite scroll** → A loading guard prevents overlapping page requests; 429 maps to a readable error with retry instead of a silent stall.
4. **TMDB terms/attribution drift** → The mandatory notice is verbatim in footer and README and listed as a hard rule in AGENT.md so no future edit removes it accidentally.
