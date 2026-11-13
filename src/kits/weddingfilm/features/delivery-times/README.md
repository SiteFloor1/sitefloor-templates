# What you receive and when (WVID-5, Starter's easy extra)

| | |
|---|---|
| Feature id | `delivery` |
| Plan | starter and above |
| Config | `delivery`: `steps` (each `{ id, label, weeksAfter, text? }`, whole weeks after the wedding, 0 = on the day), optional `note`. Heading in `sections.delivery` |
| Files | `delivery.njk`, `.js`, `.css`; dates in `src/kits/weddingfilm/lib/dates.js` |

The trailer, the film, the photographs: each a number of weeks after the wedding, the studio's own timings. With a
wedding date (typed here or chosen in the date check) each step shows its day, in UK order. Without a date, the weeks.
