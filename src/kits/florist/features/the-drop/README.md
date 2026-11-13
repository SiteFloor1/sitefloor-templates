# the-drop (florist kit, Signature)

The florist's weekly release, honestly. Before it opens: a countdown to their own day and time. While it's open: how
many are left, re-read every minute from their studio Sheet (rows `drop,left,12` and `drop,updated,2026-11-06 19:20`,
or `=NOW()` in that cell). A count older than `staleMinutes` (default 10), missing, or more than were made is never
shown: the page says to check their Instagram stories instead. `0` means sold out. Then the next week's drop.
"Remind me" saves the next opening to the customer's own calendar (nothing is sent anywhere).

Needs `todays-bouquets` (it shows as one post in the feed) and brings its own page, `drop`.

```json
"drop": {
  "name": "The Friday drop",
  "intro": "Twenty bouquets, made once, every Friday evening.",
  "when": { "day": "fri", "time": "19:00", "hours": 48 },
  "made": 20,
  "staleMinutes": 10,
  "items": [{ "name": "…", "price": 45, "photo": { "src": "img/…", "width": 800, "height": 1000, "alt": "…" }, "line": "…" }],
  "how": [{ "q": "…", "a": "…" }]
}
```

`left` may only be written in a demo (its simulated count); a client's site refuses it.

**Markup:** each look lays this feature out itself (`src/looks/<look>/features/`); the kit's template is empty and
`src/kits/florist/looks.js` refuses the feature on a look that hasn't designed it (today: Tissue only).
