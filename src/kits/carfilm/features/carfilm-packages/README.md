# Packages (CVID-1)

| | |
|---|---|
| Feature id | `carfilm-packages` |
| Plan | starter and above |
| Config | `packages` { note, items [{ id, name, for (owners, dealers, both), price, includes[], photosDays?, filmDays? }] } |

One row per package: what it includes and one price. The price is the whole price (CMA): the note must say what it
includes (travel, edit, music, VAT…), and a price can't be "from". `price: null` shows "Ask for a quote".
