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
        // Links are base64url (see send-card-logic.js) — restore standard base64 + padding before atob
        const sanitized = param.trim().replace(/[^A-Za-z0-9\-_+/]/g, '');
        if (!sanitized) return null;
        let b64 = sanitized.replace(/-/g, '+').replace(/_/g, '/');
        b64 += '='.repeat((4 - (b64.length % 4)) % 4);
        const json = decodeURIComponent(atob(b64));
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
    // Links are user-crafted: fields may be missing or not strings at all
    const str = (v) => (typeof v === 'string' ? v.trim() : '');
    const name = str(card.recipientName).slice(0, 50) || null;
    const affirmation = str(card.affirmation) || null;

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
    constructor(ogValues, cardUrl) {
        this.title = ogValues.title;
        this.description = ogValues.description;
        this.cardUrl = cardUrl;
        this.injected = false;
    }

    element(element) {
        if (this.injected) return;
        this.injected = true;

        const siteUrl = 'https://thevibecheckproject.com'; // canonical host (no www)
        const cardUrl = escapeHtml(this.cardUrl);
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

        // og:url = this card's own link on the canonical host, so a share resolves to the card
        const reqUrl = new URL(url);
        const cardUrl = `https://thevibecheckproject.com${reqUrl.pathname}${reqUrl.search}`;

        // Drop the page's static OG/Twitter tags, then inject the personalised set, so
        // crawlers never see two competing og:title / og:description values.
        const removeTag = { element(el) { el.remove(); } };
        return new HTMLRewriter()
            .on('meta[property^="og:"]', removeTag)
            .on('meta[name^="twitter:"]', removeTag)
            .on('head', new OGInjector(ogValues, cardUrl))
            .transform(originResponse);
    }
};
