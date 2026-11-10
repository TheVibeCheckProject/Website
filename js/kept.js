/**
 * THE VIBE CHECK PROJECT — "Kept days" on My Vibes (my-cards.html)
 * Lists the daily affirmations kept on the homepage (js/daily.js), each painted under the sky
 * it was opened in (js/sky.js). Everything is read from this browser's storage.
 */
(function () {
    'use strict';
    const Sky = window.VibeSky, Daily = window.VibeDaily;
    const grid = document.getElementById('keptGrid');
    if (!Sky || !Daily || !grid) return;

    function button(label, onClick) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'kept-action';
        b.textContent = label;
        b.addEventListener('click', onClick);
        return b;
    }

    async function saveImage(day) {
        try { if (document.fonts && document.fonts.load) await document.fonts.load('500 40px "Cormorant Garamond"'); } catch (e) { }
        const image = Sky.renderImage({ width: 1179, height: 2556, layout: 'wallpaper', text: day.text, hour: day.hour, date: day.date, seed: day.key, label: Daily.longDate(day.date) });
        const ok = await Daily.downloadImage(image, `vibe-check-${day.key}-wallpaper.png`);
        if (window.showToast) window.showToast(ok ? 'Saved to your downloads.' : "That didn't save. Try again?", '');
    }

    function render() {
        const days = Daily.kept();
        document.getElementById('keptEmpty').hidden = days.length > 0;
        const n = Daily.streak();
        document.getElementById('keptStreak').textContent = n >= 2 ? `${n} days in a row` : '';

        grid.replaceChildren(...days.map(day => {
            const item = document.createElement('article');
            item.className = 'kept-day';

            const art = document.createElement('div');
            art.className = 'kept-art';
            const canvas = document.createElement('canvas');
            canvas.setAttribute('aria-hidden', 'true');
            const date = document.createElement('span');
            date.className = 'kept-date';
            date.textContent = day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const words = document.createElement('p');
            words.className = 'kept-words';
            words.textContent = day.text;
            art.append(canvas, date, words);

            const send = document.createElement('a');
            send.className = 'kept-action';
            send.href = `send-card.html?message=${encodeURIComponent(day.text)}`;
            send.textContent = 'Send';

            const actions = document.createElement('div');
            actions.className = 'kept-actions';
            actions.append(send, button('Wallpaper', () => saveImage(day)), button('Remove', () => { Daily.toggleKept(day.key); render(); }));

            item.append(art, actions);
            // Paint once the canvas has a size
            requestAnimationFrame(() => Sky.paintInto(canvas, { seed: day.key, hour: typeof day.hour === 'number' ? day.hour : 20, date: day.date, horizon: 0.74 }));
            return item;
        }));
    }

    render();
})();
