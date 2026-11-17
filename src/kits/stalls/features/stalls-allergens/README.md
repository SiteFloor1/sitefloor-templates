# Allergens and food hygiene (page)

| | |
|---|---|
| Feature id | `stalls-allergens` |
| Plan | plus and above |
| Config | `allergensPage` { `title`, `intro?`, `crossContact`, `hygiene` { `rating` (0–5 or "awaiting"), `url` (the stall's listing on ratings.food.gov.uk), `checked` ("YYYY-MM") } }; the chart comes from `menu` |

The page `allergens/`: a chart of every menu item against the UK's 14 allergens (from the stall's own codes on its
menu), the stall's own words on cross-contact (shared fryers, nuts on the counter), and its food hygiene rating with
a link to its own listing and the month it was checked. The kit never writes a rating, a law or advice for a stall:
the build refuses a rating without the stall's listing.

Registered in `src/kits/stalls/kit.js`.
