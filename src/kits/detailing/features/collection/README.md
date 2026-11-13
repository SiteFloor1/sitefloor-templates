# Collection and delivery (Plus)

| | |
|---|---|
| Feature id | `collection`, Plus and above |
| Config | `collection`: `{ source: "sheet"\|"simulated", csvUrl, staleAfterHours, message, note? }`; `sections.collection` |
| Files | `collection.njk`, `.css`, `.js`, `sheet-provider.js`; the parsing in `src/kits/detailing/lib/collection.js` |

## The studio's sheet
One row per postcode district it collects from: `district` (e.g. KT13), `days` (e.g. `mon thu`), `fee` (whole pounds
each way; 0 for none; blank to leave it unsaid) and `updated_at`. Published to the web as CSV; the link goes in
`csvUrl`.

## How it works
The visitor types a postcode (or just its first half) and picks a day. The page answers in plain words: yes on that
day (with the charge if the sheet gives one), not that day but these days, or "we don't usually collect from there,
ask us". "Ask us on WhatsApp" sends the district and the day, never the full postcode.

## When something is missing or fails
A sheet that can't be read, or that nobody has touched in `staleAfterHours`, answers "we can't check just now, ask us",
never a yes. Client sites must use `source: "sheet"`; `simulated` is for the demo only (`src/demo/collection-provider.js`).
A look can move it to the book page with `onPages` ("book-page").
