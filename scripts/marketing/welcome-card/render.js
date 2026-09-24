/**
 * Renders the welcome-email card (scene.html) to a looping GIF.
 *
 *   node scripts/marketing/welcome-card/render.js
 *   node scripts/marketing/welcome-card/render.js --message "Your words here" --width 600 --fps 15
 *
 * Output: assets/email/welcome-card.gif (+ welcome-card-still.png, the first frame, for
 * email apps that don't animate GIFs, e.g. Outlook on Windows shows frame 1 only).
 * Needs Microsoft Edge (Playwright channel 'msedge') and ffmpeg on PATH.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..', '..', '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) =>
    (a.startsWith('--') ? acc.concat([[a.slice(2), all[i + 1]]]) : acc), []));

const OUT_DIR = path.join(ROOT, 'assets', 'email');
const NAME = args.out || 'welcome-card';
const GIF = path.join(OUT_DIR, NAME + '.gif');
const BG = args.bg || 'transparent';       // or a colour matching the email background
const TRANSPARENT = BG === 'transparent';
// Card artwork: a file name from assets/backgrounds/ (e.g. bg_free_sunset_1772750341964.webp)
const CARD = args.card === 'none' ? '' : (args.card || 'assets/email/bg-neutral-slate.png'); // chosen Sept 2026
const CARD_BG = !CARD ? '' : CARD.includes('/') ? '../../../' + CARD : '../../../assets/backgrounds/' + CARD;
const STILL = path.join(OUT_DIR, NAME + '-still.png');
const BACK = path.join(OUT_DIR, NAME + '-back-preview.png'); // preview only, not used in the email
const FPS = Number(args.fps || 15);          // GIF frame rate (smoothness vs file size)
const GIF_WIDTH = Number(args.width || 480); // pixels; shown ~240px wide in the email = 2x for sharp phones (~1.5 MB)
const MESSAGE = args.message || 'We hope to help you smile a little more than yesterday.';

(async () => {
    const frames = fs.mkdtempSync(path.join(os.tmpdir(), 'welcome-card-'));
    const browser = await chromium.launch({ channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
        await page.goto('file://' + path.join(__dirname, 'scene.html').replace(/\\/g, '/'));
        const info = await page.evaluate((o) => window.setup({ message: o.message, bg: o.bg, cardBg: o.cardBg, wash: o.wash }), { message: MESSAGE, bg: BG, cardBg: CARD_BG, wash: args.wash ? Number(args.wash) : 0.28 });
        const total = Math.round(info.loopSeconds * FPS);
        const canvas = await page.$('#stage');
        for (let i = 0; i < total; i++) {
            await page.evaluate((t) => window.renderFrame(t), i / FPS);
            await canvas.screenshot({ path: path.join(frames, `f${String(i).padStart(4, '0')}.png`), omitBackground: TRANSPARENT });
        }
        console.log(`rendered ${total} frames (${info.loopSeconds}s at ${FPS} fps)`);
    } finally {
        await browser.close();
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });
    const input = path.join(frames, 'f%04d.png');
    const palette = path.join(frames, 'palette.png');
    const scale = `scale=${GIF_WIDTH}:-2:flags=lanczos`;
    // Identical frames during the holds collapse into one frame with a longer delay
    const dedupe = 'mpdecimate=hi=0:lo=0:frac=0';
    // Two-pass GIF: build one palette tuned to this animation, then map frames onto it
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-framerate', String(FPS), '-i', input,
        '-vf', `${scale},palettegen=max_colors=256:stats_mode=diff${TRANSPARENT ? ':reserve_transparent=1' : ''}`, palette]);
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-framerate', String(FPS), '-i', input, '-i', palette,
        '-lavfi', `${dedupe},${scale}[x];[x][1:v]paletteuse=dither=sierra2_4a:diff_mode=rectangle${TRANSPARENT ? ':alpha_threshold=128' : ''}`, '-fps_mode', 'vfr', '-loop', '0', GIF]);
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', path.join(frames, 'f0000.png'), '-vf', scale, STILL]);
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', path.join(frames, 'f' + String(Math.round(4 * FPS)).padStart(4, '0') + '.png'), '-vf', scale, BACK]);
    fs.rmSync(frames, { recursive: true, force: true });

    const kb = (f) => (fs.statSync(f).size / 1024).toFixed(0) + ' KB';
    console.log(`GIF:   ${path.relative(ROOT, GIF)}  ${kb(GIF)}`);
    console.log(`still: ${path.relative(ROOT, STILL)}  ${kb(STILL)}`);
})().catch((e) => { console.error(e); process.exit(1); });
