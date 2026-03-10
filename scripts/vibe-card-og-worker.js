/**
 * Vibe Check OG Meta Tag Injector — Cloudflare Worker
 *
 * Intercepts requests to /view-card.html?data=... and uses HTMLRewriter
 * to inject personalized Open Graph + Twitter Card meta tags so link
 * previews on iMessage, WhatsApp, Discord, and Telegram show the
 * recipient's name and the affirmation snippet instead of generic text.
 *
 * Deployment instructions:
 * 1. In Cloudflare Dashboard → Workers & Pages → Create Worker
 * 2. Paste this entire file and deploy.
 * 3. Add a route: www.thevibecheckproject.com/view-card.html*
 *    (or thevibecheckproject.com/view-card.html* if you also use the apex domain)
 * 4. No environment secrets required — card data comes from the URL param.
 */

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/'/g, '&#39;');
}

function truncate(str, max = 120) {
    if (!str || str.length <= max) return str;
    return str.slice(0, max - 1) + '…';
}

/**
 * Decode the card payload from the ?data= URL param.
 * Returns null if the param is missing or malformed.
 */
function decodeCardData(url) {
    try {
        const param = new URL(url).searchParams.get('data');
        if (!param) return null;
        const json = decodeURIComponent(atob(param));
        const card = JSON.parse(json);
        return card && typeof card === 'object' ? card : null;
    } catch {
        return null;
    }
}

/**
 * Builds the personalised OG meta content values from the card object.
 */
function buildOGValues(card) {
    const name = card.recipientName && card.recipientName.trim()
        ? card.recipientName.trim()
        : null;

    const affirmation = card.affirmation && card.affirmation.trim()
        ? card.affirmation.trim()
        : null;

    const title = name
        ? `${escapeHtml(name)}, someone sent you a Vibe Check ✨`
        : 'You\'ve Got a Vibe Check ✨';

    const snippet = affirmation
        ? `"${escapeHtml(truncate(affirmation, 100))}" — open your card to feel the good vibes.`
        : 'Someone sent you an anonymous affirmation card. Tap to open it and feel the good vibes.';

    return { title, description: snippet };
}

/**
 * HTMLRewriter element handler that injects OG meta tags
 * right before </head>.
 */
class OGInjector {
    constructor(ogValues) {
        this.title = ogValues.title;
        this.description = ogValues.description;
        this.injected = false;
    }

    element(element) {
        if (this.injected) return;
        this.injected = true;

        const siteUrl = 'https://www.thevibecheckproject.com';
        const cardUrl = `${siteUrl}/view-card.html`;
        const imageUrl = `${siteUrl}/assets/og-vibe-card.jpg`;

        const tags = `
  <!-- Personalised OG tags — injected by Cloudflare Worker -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="The Vibe Check Project">
  <meta property="og:url" content="${cardUrl}">
  <meta property="og:title" content="${this.title}">
  <meta property="og:description" content="${this.description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="A Vibe Check card glowing with soft light">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${this.title}">
  <meta name="twitter:description" content="${this.description}">
  <meta name="twitter:image" content="${imageUrl}">`;

        element.prepend(tags, { html: true });
    }
}

export default {
    async fetch(request) {
        const url = request.url;

        // Only intercept GET requests to view-card.html
        if (request.method !== 'GET' || !url.includes('/view-card.html')) {
            return fetch(request);
        }

        // Fetch the original HTML from the origin
        const originResponse = await fetch(request);

        // If origin returned an error, pass it through unchanged
        if (!originResponse.ok) return originResponse;

        // Decode card data — if absent/malformed, serve page as-is
        const card = decodeCardData(url);
        if (!card) return originResponse;

        const ogValues = buildOGValues(card);

        // Use HTMLRewriter to inject tags before </head>
        return new HTMLRewriter()
            .on('head', new OGInjector(ogValues))
            .transform(originResponse);
    }
};
