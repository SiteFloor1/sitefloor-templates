# fit-passport (lingerie kit, Signature) · private page `passport`

After a fitting the shop gives her a code (eight letters and numbers, no 0/O/1/I). The private page (`passport#CODE`,
kept out of search and the sitemap) shows her sizes, shape by shape, as the fitter wrote them in the shop's Google
Sheet, and the date. Whoever she gives the code to can add a budget and ask the shop on WhatsApp for pieces in her
sizes; the code goes with the message. If the sheet can't be reached, it says so and offers WhatsApp (fails closed).

The sheet holds **no names**: columns `code, shape, size, updated_at`, one row per shape. To stop sharing, the shop
deletes her rows. Say this in `note`.

**A published tab is public:** anyone with its link can download every code's sizes. Publish a tab that holds only
`code, shape, size, updated_at`, never names, phone numbers, emails or notes; keep anything else on another, unpublished
tab. The codes are eight characters from 31, so they can't be guessed, but the published tab itself is not private.

```json
"passport": { "source": "sheet", "csvUrl": "https://docs.google.com/spreadsheets/…output=csv", "note": "…" }
```
Demo sites may use `"source": "sample"` with `"sample"` rows and an `"exampleCode"`; refused on client sites.
