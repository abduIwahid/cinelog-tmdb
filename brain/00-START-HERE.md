# Start here — CineLog

**One-liner:** A TMDB movie finder + watchlist whose security model is the feature: no token in the code, ever — each visitor pastes their own free Read Access Token, kept in their localStorage and sent only to TMDB.

**Current phase:** Phase 1 built — static app, not yet deployed. (TMDB code paths code-reviewed; they cannot be smoke-tested without a token — see API_SPEC.)

**Reading order:**
1. [PRD.md](PRD.md) — what and why
2. [ARCHITECTURE.md](ARCHITECTURE.md) — how it is put together
3. [API_SPEC.md](API_SPEC.md) — endpoints, fields, limits
4. [DESIGN.md](DESIGN.md) — tokens and component states
5. [TOOLS.md](TOOLS.md) — API choice, hosting plan, fallbacks
6. [BUILD_PLAN.md](BUILD_PLAN.md) — phases and what is left
7. [DECISIONS.md](DECISIONS.md) — ADR log
8. [RISKS.md](RISKS.md) — risks and fallbacks
9. [DEMO_DATA.md](DEMO_DATA.md) — inputs that demo well
10. [JUDGE_QA.md](JUDGE_QA.md) — interviewer Q&A
11. [TEAM.md](TEAM.md) · [SUBMISSION.md](SUBMISSION.md) · [RETRO.md](RETRO.md)
12. [changes/](changes/) — changelog, current state, session logs
