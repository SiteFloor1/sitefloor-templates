# private-evening (lingerie kit, Signature)

The private evening: the shop closes for one client (and a guest, if the shop allows). Its free evenings come from its
own Google Sheet (`date, start, status, updated_at`; status `free` or `held`); an evening today shows only before it
starts, and if the sheet hasn't been updated within `staleAfterHours` none are shown ("Message us for the next free
evening"), so an old sheet never offers a taken evening. Choose one, add guests, the occasion and a name, and ask on
WhatsApp; the deposit (optional) is the shop's own Stripe Payment Link.

```json
"evenings": { "source": "sheet", "csvUrl": "https://docs.google.com/spreadsheets/…output=csv", "staleAfterHours": 48, "minutes": 90, "guestsMax": 1, "photo": { … }, "note": "…", "deposit": { "amount": 100, "payLink": "evening-deposit", "note": "taken off what you choose" } }
```
Demo sites may use `"source": "sample"` with `"sample": [{ "date", "start", "status" }]`. Heading: `sections.evening`.
