// Guides index (blog/index.html): search + topic filter over the guide list.
// The topic hubs load this file too; without the search box it only does the #crisis part.
(function () {
    'use strict';

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Arriving at #crisis (the nav's "Emergency Support" badge): web fonts load late and can
    // move the section after the browser's own jump, so line it up once more when they settle.
    function settleHash() {
        if (location.hash !== '#crisis') return;
        var el = document.getElementById('crisis');
        if (!el) return;
        var touched = false;
        ['wheel', 'touchstart', 'keydown'].forEach(function (t) {
            window.addEventListener(t, function () { touched = true; }, { passive: true, once: true });
        });
        var align = function () { if (!touched) el.scrollIntoView({ behavior: 'auto', block: 'start' }); };
        window.addEventListener('load', align);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(align);
    }
    settleHash();

    var grid = document.getElementById('guideGrid');
    var input = document.getElementById('guideSearch');
    if (!grid || !input) return;

    var guides = Array.prototype.slice.call(grid.querySelectorAll('.guide'));
    var chips = Array.prototype.slice.call(document.querySelectorAll('button.g-chip[data-topic]'));
    var msgSection = document.getElementById('messageIdeas');
    var msgRows = msgSection ? Array.prototype.slice.call(msgSection.querySelectorAll('.g-msg-list li')) : [];
    var countEl = document.getElementById('guideCount');
    var emptyEl = document.getElementById('guideEmpty');
    var emptyWord = document.getElementById('guideEmptyWord');
    var noteEl = document.getElementById('topicNote');
    var clearBtn = document.getElementById('guideSearchClear');

    var topicNames = {};
    chips.forEach(function (c) { topicNames[c.dataset.topic] = c.dataset.label || c.textContent.trim(); });

    function textOf(el) { return (el.textContent || '').replace(/\s+/g, ' ').toLowerCase(); }
    guides.forEach(function (g) { g._text = textOf(g); g._topics = (g.dataset.topics || '').split(' '); });
    msgRows.forEach(function (r) { r._text = textOf(r) + ' ' + (r.dataset.keywords || ''); });

    var state = { topic: 'all', q: '' };

    function matches(text, words) {
        for (var i = 0; i < words.length; i++) if (text.indexOf(words[i]) === -1) return false;
        return true;
    }

    function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }

    function apply(animate) {
        var words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
        var filtered = state.topic !== 'all' || words.length > 0;
        var shown = 0;

        grid.classList.toggle('is-filtered', filtered);
        guides.forEach(function (g) {
            var ok = (state.topic === 'all' || g._topics.indexOf(state.topic) !== -1) && matches(g._text, words);
            g.hidden = !ok;
            g.classList.remove('is-entering');
            if (!ok) return;
            // Once someone filters, nothing waits for scroll-reveal any more
            if (animate) g.classList.add('is-in');
            g.style.setProperty('--i', Math.min(shown, 9));
            shown++;
        });

        if (animate && !reduced) {
            void grid.offsetWidth;
            guides.forEach(function (g) { if (!g.hidden) g.classList.add('is-entering'); });
        }

        // "Messages to copy" belong to no topic: they join a search, and step aside for a topic
        var rowsShown = 0;
        msgRows.forEach(function (r) {
            var ok = state.topic === 'all' && matches(r._text, words);
            r.hidden = !ok;
            if (ok) rowsShown++;
        });
        if (msgSection) msgSection.hidden = rowsShown === 0;

        chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.topic === state.topic)); });

        if (noteEl) {
            var notes = noteEl.querySelectorAll('[data-note]');
            var any = false;
            Array.prototype.forEach.call(notes, function (n) {
                var on = n.dataset.note === state.topic;
                n.hidden = !on;
                if (on) any = true;
            });
            noteEl.hidden = !any;
        }

        if (countEl) {
            var text;
            if (words.length) {
                var total = shown + rowsShown;
                text = plural(total, 'result') + ' for “' + state.q.trim() + '”';
            } else if (state.topic !== 'all') {
                text = plural(shown, 'guide') + ' in ' + topicNames[state.topic];
            } else {
                text = plural(shown, 'guide') + (rowsShown ? ' and ' + plural(rowsShown, 'message list') : '');
            }
            countEl.textContent = text;
        }

        if (emptyEl) {
            var none = shown === 0 && rowsShown === 0;
            emptyEl.hidden = !none;
            if (none && emptyWord) emptyWord.textContent = state.q.trim();
        }
        if (clearBtn) clearBtn.hidden = state.q.length === 0;
    }

    function setQuery(q, focus) {
        state.q = q;
        if (input.value !== q) input.value = q;
        // A search looks through everything, not only the topic that was open
        if (q.trim()) state.topic = 'all';
        apply(true);
        if (focus) input.focus({ preventScroll: true });
    }

    var timer = null;
    input.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(function () { setQuery(input.value, false); }, 90);
    });
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && input.value) { e.preventDefault(); setQuery('', false); }
    });
    var form = input.form;
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); clearTimeout(timer); setQuery(input.value, false); });

    if (clearBtn) clearBtn.addEventListener('click', function () { setQuery('', true); });

    Array.prototype.forEach.call(document.querySelectorAll('[data-q]'), function (b) {
        b.addEventListener('click', function () { setQuery(b.dataset.q, false); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-guides-reset]'), function (b) {
        b.addEventListener('click', function () { state.topic = 'all'; setQuery('', true); });
    });

    chips.forEach(function (c) {
        c.addEventListener('click', function () {
            state.topic = c.dataset.topic;
            state.q = '';
            input.value = '';
            apply(true);
        });
    });

    // Old links such as blog/index.html#grief-support open with that topic chosen (no scrolling)
    var fromHash = location.hash.replace('#', '');
    if (fromHash && topicNames[fromHash] && fromHash !== 'all') state.topic = fromHash;

    apply(false);
})();
