# Stain and aftercare

| | |
|---|---|
| Feature id | `stain-guide` |
| Plan | plus and above (a page: `aftercare.html`) |
| Config | `aftercare`: `stages` (2–5, `{ when, label, text, photo? }`: e.g. "The evening", "Paste on"), `steps` (the artist's aftercare, one line each), `lasts` (how long it lasts, in their words); `aftercarePage`: `{ kicker, title, intro }` |

## How it works
The stain as it develops, stage by stage, on real photographs where the artist has them: paste on, paste off, orange,
deep brown. Then the artist's aftercare as a numbered list (the order matters: keep the paste on, no water, warmth,
no scrubbing), how long it lasts, and the NHS line on "black henna".

## When something is missing or fails
Nothing is live. Timings are the artist's, written as they say them.

Registered in `src/kits/mehndi/kit.js`. Add to a site by listing the id in `features` in its `site.json`.
