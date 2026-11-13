# stylists (hair kit, Starter)

The stylists through their work: one photograph of each stylist's signature cut or colour (`work`, never a portrait), and under it the name, their level and the line they're known for, their next
free day from the salon's published Google Sheet, and "Book Ines" on WhatsApp with their name in the message. The next
free day shows only from a row updated within `staleAfterDays` (default 2), never updated in the future and never a day
that has passed; each stylist's row is judged on its own. Until it loads the line is empty and keeps its height, so
nothing moves. Give every stylist a `work` photograph in one grade, or none: without them it is a ruled list. On a phone the
photographs swipe sideways, so the home page stays short.

```json
"stylists": { "message": "Hello …, I'd like to book.",
  "freeDays": { "source": "sheet", "csvUrl": "https://docs.google.com/spreadsheets/d/e/…/pub?gid=0&single=true&output=csv", "staleAfterDays": 2 },
  "items": [{ "id": "ines", "name": "Ines Varga", "level": "senior", "line": "Precision cuts, short to mid.",
    "does": ["cuts", "mens"], "textures": ["straight", "waves"], "work": { "src": "img/…", "width": 960, "height": 1200, "alt": "…" } (optional) }] }
```

The sheet: a header row, then one row per stylist: `stylist` (the id), `next free` (2026-11-12 or 12/11/2026),
`updated` (the date the row was last changed). The salon updates it from their booking app each morning; leave
`freeDays` out and the lines stay empty. `does` (cuts, colour, textured, extensions, mens, occasion, treatments) and
`textures` feed the stylist match and the texture strip. The demo simulates the days (`src/demo/free-days-provider.js`).
