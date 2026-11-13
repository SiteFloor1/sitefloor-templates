# Seasonal stands

| | |
|---|---|
| Feature id | `seasonal-tea` |
| Plan | plus |
| Config | `tea.seasons` (required, at least one): `id`, `name`, `from`, `to` (YYYY-MM-DD), `price` (per guest), `text`, `photo?`; `sections.seasonalTea` |

## How it works
The year's seasonal afternoon teas (Christmas, Valentine's, Mother's Day…) with their dates, price and photograph.
On the day, the one being served leads, marked "Being served now"; otherwise the next one, marked "Next". Each has an
"Ask for a table" WhatsApp link. Dates and prices are the café's own; `npm run seasons -- --year 2027` suggests dates.

## When something is missing or fails
Without JavaScript every stand shows in date order.
