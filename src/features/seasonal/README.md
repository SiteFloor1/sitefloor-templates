# Seasonal modes

| | |
|---|---|
| Feature id | `seasonal` |
| Plan | starter and above |
| Config | `seasons`: list of `{ name, from, to, banner, link?, tint? }` |
| Files | `seasonal.njk`, `seasonal.css`, `seasonal.js`; dates and presets in `src/core/lib/seasons.js` |

```json
"seasons": [
  { "name": "Christmas", "from": "2026-12-01", "to": "2026-12-31", "tint": "festive",
    "banner": "Christmas hours are on. Book early, December fills up fast.",
    "link": { "label": "See Christmas hours", "href": "#visit" } }
]
```

## How it works
On the shop's date (UK time), the season covering today shows a banner above the header and sets `data-season` on the page, so the look can shift its colours (tints: `festive`, `winter`, `spring`, `summer`, `autumn`, `gold`). Seasons start and end on their dates without a rebuild. If two overlap, the one that started most recently shows, so a short event inside a longer one wins.

## Choosing dates
`npm run seasons -- --year 2027` prints suggested UK dates for 15 occasions (New Year, Lunar New Year, Valentine's, Ramadan, Eid al-Fitr, Mother's Day, Easter, Eid al-Adha, Father's Day, summer holidays, back to school, October half-term, Diwali, Black Friday, Christmas). Lunar dates are marked approximate: they can move by a day once the moon is sighted, so confirm them with the client. Copy the ones the shop wants into `seasons` and edit the wording to theirs.

## Looks
Each look sets `--season-bg` and `--season-fg`, and may override them (and `--accent`) under `:root[data-season="…"]`. Without that, the banner uses the look's accent.

## When something is missing or fails
Without JavaScript, the banner that was on at build time shows. Seasons are limited to 120 days and validated at build.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
