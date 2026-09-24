# The Vibe Check Project

Static site (plain HTML/CSS/JS, no framework) on GitHub Pages behind Cloudflare. See `docs/README.md` for how it works and `docs/scripts.md` for tooling.

## Rules
- Run `npm run build` after changing pages, CSS/JS, the nav/footer partials or `data/*.json`. It regenerates hubs, listicles and message pages, stamps the shared nav/footer, sets `?v=` content hashes and rebuilds the sitemap.
- Never hand-edit generated regions (`site-nav` / `site-footer` markers) or `?v=` values.
- Canonical URLs are on the bare domain `https://thevibecheckproject.com`, extensionless (`/about`, `/blog/<post>`; message pages and hubs end in `/`). `view-card.html` and `my-cards.html` are noindex and stay out of the sitemap.
- Page titles: `Primary Keyword - Context | The Vibe Check Project`; one `<h1>` per page.
- No client-side dependencies or frameworks.
- Card links (`view-card.html?data=`) must stay backward compatible: old cards live in people's messages forever.
- Never invent testimonials, statistics or user counts. Premium copy must match what it actually unlocks.
- Browser automation: use Microsoft Edge (`channel: 'msedge'`), never Chrome.
