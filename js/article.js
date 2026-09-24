/**
 * THE VIBE CHECK PROJECT — Long-form article pages (blog/*.html)
 * Copy-to-clipboard for example messages and the reading progress bar.
 * Loaded after core-utils.js; these pages don't load script.js.
 */

// Called from inline onclick="copyText('msg-id', this)" on example messages
function copyText(elementId, btn) {
    const el = document.getElementById(elementId);
    if (!el || !navigator.clipboard) return;
    const text = el.innerText.replace(/^["“”]/, '').replace(/["“”]$/, '').trim();
    navigator.clipboard.writeText(text).then(() => {
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.classList.remove('copied');
        }, 2000);
    }).catch(() => { });
}
window.copyText = copyText;

// Reading progress bar along the top of the page
(function () {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;
    let scheduled = false;
    function update() {
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        bar.style.width = (max > 0 ? Math.min(window.pageYOffset / max * 100, 100) : 0) + '%';
        scheduled = false;
    }
    window.addEventListener('scroll', () => {
        if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
    }, { passive: true });
})();
