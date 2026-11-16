# The diary (hero, Starter, PT-2)

The trainer's week as a printed appointment page: their working days across, one row per hour down. Hours that are
spoken for stay blank, hours already gone this week shade as passed, and the few open hours are printed in ink.
Tapping one fills it and the button asks for that hour on WhatsApp (or the trainer's booking channel). A photograph
can sit over a block of spoken-for hours; if an open hour ever falls inside that block, the photograph steps aside.

## The trainer's sheet

A Google Sheet published as CSV (File → Share → Publish to web → CSV) listing only the open hours:

| date | time | updated_at |
|---|---|---|
| 2026-11-16 | 06:00 | 2026-11-15 21:10 |
| 2026-11-18 | 07:00 | |

Fails closed: a sheet older than `staleAfterHours` (default 36), unreadable, or with anything written in another column
(a client's name, a number) offers no hours; the line under the diary says to message for times.

## site.json

```json
"diary": {
  "source": "sheet",
  "csvUrl": "https://docs.google.com/spreadsheets/d/e/…/pub?output=csv",
  "staleAfterHours": 36,
  "days": ["mon", "tue", "wed", "thu", "fri", "sat"],
  "from": "06:00", "to": "20:00",
  "priceFrom": 120,
  "photo": { "src": "img/trainer.webp", "width": 1100, "height": 1257, "alt": "…", "caption": "…",
             "block": { "days": ["wed", "thu"], "from": "08:00", "to": "17:00" } }
}
```

Demos use `"source": "simulated"` (src/demo/diary-provider.js), which client sites refuse.
