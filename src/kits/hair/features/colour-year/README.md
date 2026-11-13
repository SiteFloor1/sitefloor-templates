# colour-year (hair kit, Plus)

The colour upkeep planner. Choose the colour you had and the day it was done (UK order); the next visits are marked
on the coming twelve months, every `weeks` from that day (the salon's usual; the page says so). "Add these to my
calendar" downloads them as all-day events; "Book the next one" sends the colour and its next date on WhatsApp. It
first paints with the default colour done three weeks ago, labelled as an example, so the year is never empty.

```json
"upkeep": { "message": "Hello …, I'd like to book my colour.", "default": "balayage",
  "photo": { "src": "img/upkeep.webp", "width": 960, "height": 1200, "alt": "…" },
  "items": [{ "id": "roots", "name": "Root tint", "weeks": 6, "text": "Regrowth shows from about five weeks.", "care": ["…"] }] }
```
`text` and `care` are shown on the colour upkeep page (`upkeep-page`). Heading: `sections.colourYear`.
