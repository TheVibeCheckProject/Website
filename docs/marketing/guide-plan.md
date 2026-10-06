# Weekly guide plan

One new guide a week, to bring in people from Google searches. Part of the growth plan
("Vibe Check Growth Plan", a Claude doc).

## Topics, in order (one per week)

Tick a topic only after the owner says "looks good, publish" and it is live.

- [x] 1. What to text someone whose pet died
- [ ] 2. What to say on the anniversary of someone's death
- [ ] 3. Encouraging texts for someone in recovery
- [ ] 4. Messages for a friend going through a divorce
- [ ] 5. What to text a new parent who's struggling
- [ ] 6. What to say to someone in the hospital
- [ ] 7. Kind messages for a coworker having a hard time

Coverage check (2026-09-29): no existing guide covers any of these. Two overlap partly:
- **#6** overlaps the "For Surgery or Hospital Stay" section of
  `blog/what-to-write-in-a-get-well-soon-card.html` (written card messages). The new guide is broader
  (texts and what to say in person) and should link to that section, not repeat it.
- **#7** overlaps the "For a Coworker" section of the same guide (only about illness). The new guide
  covers any hard time at work or home; link to that section too.

## When the owner says "write the next guide"

1. Take the next unchecked topic.
2. Match the style of the existing guides exactly. Model: `blog/what-to-text-someone-having-a-panic-attack.html`:
   - `article.css`, one `<h1>`
   - a numbered "N Texts to..." list where every message is a `copyable-message-block` with its
     Send as Card action
   - an inline CTA
   - a "What *Not* to Text" section
   - "Keep reading" related-card links to 3 existing guides that fit
3. Real, useful messages written for the reader to send. **No invented stories, people, quotes,
   testimonials or statistics.**
4. A short "why this helps" part.
5. Title / meta description / canonical / JSON-LD in the same format as the other guides
   (title: `Primary Keyword - Context | The Vibe Check Project`; canonical on the bare domain, extensionless).
6. Add it to `blog/index.html` the same way the others are listed.
7. Run `npm run build`, then `npm test`, and fix anything that fails.
8. Show the owner a preview (phone and desktop screenshots) and **wait**.
9. Publish only when the owner says **"looks good, publish"**. Then tick the topic above.
