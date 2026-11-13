# Design library

| | |
|---|---|
| Feature id | `mehndi-designs` |
| Plan | plus and above (a page: `designs.html`) |
| Config | `designs`: `message` (WhatsApp opening), `items` (`{ id, name, style, coverage, for, hours, price, from?, photo }`; style: traditional, arabic, indo-arabic, contemporary; coverage: palms, wrist, mid-arm, elbow, feet, back-hand; for: bridal, guest); `designsPage`: `{ kicker, title, intro }` |

## How it works
The artist's own work, close and large, as gallery labels: the name, then the style, how far it goes, the hours and a
from price. Two rows of filters (style, and bridal or guests) show only the styles the artist has. "Ask for this"
sends the design's name on WhatsApp.

## When something is missing or fails
Without JavaScript every design shows and the filters stay invisible (their space is kept, so nothing moves when the script starts). A filter that would show nothing is never offered.

Registered in `src/kits/mehndi/kit.js`. Add to a site by listing the id in `features` in its `site.json`.
