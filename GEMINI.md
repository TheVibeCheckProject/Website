# Instructions for Gemini

Start here, in this order:

1. **`docs/HANDOFF.md`**: where the project stands right now, what's in progress, open decisions,
   how the owner likes to work, and technical traps already hit. Read it fully before doing anything.
2. **`CLAUDE.md`**: the project rules (build, canonical URLs, card-link compatibility, no invented
   claims, Edge for browser automation). They apply to you exactly as written.
3. `docs/README.md` (how the site works) and `docs/scripts.md` (build scripts, newsletter jobs, workers).

Essentials, in short:
- Work on `main`; **pushing deploys the live site**. Run `npm run build` and `npm test` before pushing.
- Small phases, plain-language explanations, click-by-click steps for dashboards.
- Nothing untrue on the site or in emails. Never put the owner's name on the website.
- `assets/testassetcode/` holds the card-flow and send-button prototypes. It is git-ignored on purpose; never commit it.
- Keep `docs/HANDOFF.md` updated when you finish something, so the next session knows.
