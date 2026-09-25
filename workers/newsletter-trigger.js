/**
 * vibe-newsletter-trigger: starts the GitHub Actions newsletter jobs on time.
 *
 * GitHub's own schedule is best-effort (our daily email ran 3-4 hours late and the monthly job was
 * skipped on 2026-09-25). Cloudflare Cron Triggers fire on time, so this worker asks GitHub to run
 * the workflows right away ("workflow_dispatch"). The GitHub schedules stay in the workflow files as
 * a backup; the daily sender skips a date that was already sent, so nobody gets two emails.
 *
 * Setup (Cloudflare dashboard → Workers & Pages → this worker):
 *   1. Paste this file and Deploy.
 *   2. Settings → Variables and Secrets → add Secret GITHUB_TOKEN: a fine-grained GitHub token for
 *      the TheVibeCheckProject/Website repo with "Actions: Read and write" permission.
 *   3. Settings → Triggers → Cron Triggers → add three:
 *        0 14 * * *     daily email, 9 AM Central in summer (CDT)
 *        0 15 * * *     daily email, 9 AM Central in winter (CST)
 *        0 10 25 * *    monthly content generation (25th)
 *      Cron times are UTC; the code only sends the daily email in the run where it's 9 AM in Chicago,
 *      so daylight saving never makes it an hour early or late.
 * Test: in the worker's editor use the "Schedule" / scheduled-event test, or check GitHub → Actions.
 */

const REPO = 'TheVibeCheckProject/Website';

async function dispatch(env, workflow) {
    const res = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/${workflow}/dispatches`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'vibe-newsletter-trigger',
        },
        body: JSON.stringify({ ref: 'main' }),
    });
    // 204 = started. Anything else: log it (visible in the worker's Logs tab)
    if (res.status !== 204) console.error(`dispatch ${workflow} failed: ${res.status} ${await res.text()}`);
    else console.log(`dispatched ${workflow}`);
}

function chicagoHour(date) {
    return Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', hour: 'numeric', hour12: false }).format(date));
}

export default {
    async scheduled(event, env, ctx) {
        if (!env.GITHUB_TOKEN) { console.error('Missing GITHUB_TOKEN secret'); return; }
        if (event.cron === '0 10 25 * *') {
            ctx.waitUntil(dispatch(env, 'generate-newsletter-batch.yml'));
            return;
        }
        // Daily email: two UTC triggers cover summer and winter time; only the 9 AM Chicago one sends
        if (chicagoHour(new Date(event.scheduledTime)) === 9) {
            ctx.waitUntil(dispatch(env, 'daily-newsletter.yml'));
        }
    },

    // Visiting the worker's URL only reports that it's alive; it never triggers anything
    async fetch() {
        return new Response('vibe-newsletter-trigger: runs on a schedule only.', { headers: { 'Content-Type': 'text/plain' } });
    },
};
