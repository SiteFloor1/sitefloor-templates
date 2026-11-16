# Is my date free?

| | |
|---|---|
| Feature id | `bridalbeauty-dates` |
| Plan | starter |
| Config | `dateCheck`: `{ source: "sheet", csvUrl, staleAfterDays?, message, lead? }` (`"simulated"` on demos only) |
| Files | `sheet-provider.js` (client sites), `src/demo/bridal-diary-provider.js` (demos); the answer is on the cover |

The artist keeps one Google Sheet, published as CSV, a row per date that isn't simply open:

```
date,status,updated_at
2027-06-12,taken,2026-11-02 09:12
2027-06-19,held,
```

`status` is open, held (another bride has it until her booking fee is in) or taken; any date not listed is open. The
newest `updated_at` says when the sheet was last looked after. The cover never says booked. It fails closed: a sheet
that can't be read, an unknown word, a bad date, or one not updated for `staleAfterDays` (21 by default) makes the cover
say "Ask me." and send the bride to WhatsApp instead.
