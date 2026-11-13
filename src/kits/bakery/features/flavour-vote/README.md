# flavour-vote (bakery kit, Plus)

The shop asks one question ("Which flavour stays for winter?") on its own free Google Form. Each flavour on the page
links to the Form with that answer filled in, so voting is one tap. The share of this week's votes shows under each
flavour, and choosing one shows a **my vote** card to keep or send to a friend on WhatsApp. The card never says the
vote was counted: the visitor still presses Submit on the Form.

## Setting it up (once, about ten minutes)
1. Make a Google Form with one multiple-choice question; the choices are the flavour names, written exactly as below.
2. In the Form: ⋮ → **Get pre-filled link**, pick any answer, copy the link. The `entry.1234567` part is `field`.
3. Responses → **Link to Sheets**. In the Sheet: File → Share → **Publish to web** → the responses tab → CSV. That's `csvUrl`.
4. Each week, change the question and `closes` (the last day of voting). Only answers from the 7 days up to `closes` count.

## Config (`site.vote`)
```json
"vote": {
  "question": "Which flavour stays for winter?",
  "formUrl": "https://docs.google.com/forms/d/e/1FAIpQL…/viewform",
  "field": "entry.1234567",
  "source": "sheet",
  "csvUrl": "https://docs.google.com/spreadsheets/d/e/…/pub?gid=0&single=true&output=csv",
  "closes": "2026-11-01",
  "candidates": [{ "id": "pistachio", "name": "Pistachio", "photo": { "src": "img/g-pistachio.webp", "width": 720, "height": 960, "alt": "…" } }]
}
```
2–8 candidates. `source: "simulated"` is for demos only (refused on client sites). Logic: `lib/vote.js` (unit-tested).
