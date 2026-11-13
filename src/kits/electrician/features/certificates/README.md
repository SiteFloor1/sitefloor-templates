# certificates (electrician kit, Signature)

"Your home's certificates": a private page (`/your-home`, `noindex`, not in the menu or the sitemap). The homeowner
opens the link the client sent (`https://example.co.uk/your-home#HX7Q2M`) or types the code, and sees what was
certified at their home and when (EICR, Part P, minor works, the charger's record, the warranty), the next inspection
date and "Remind me", a calendar file (.ics, times in UTC) for some weeks before it's due. "Ask for a copy" sends the
code on WhatsApp.

## The client's sheet
One Google Sheet published to the web as CSV, one row per certificate:

| code | kind | issued | next_due | note |
|---|---|---|---|---|
| HX7Q2M | eicr | 2026-03-14 | 2031-03-14 | Satisfactory. Two C3 observations, explained on page 3. |

- `kind`: `eicr`, `eic`, `part-p`, `minor-works`, `ev` or `warranty` (the page's wording can be changed in `kinds`).
- `next_due`: the date the electrician wrote on the EICR. Left empty, the page adds the client's `intervalYears`.
- **No names, addresses, phone numbers or links to the certificates** (they carry the address): a published sheet can
  be read by anyone with its link. Copies go by WhatsApp.

```json
"certificates": { "kicker": "Your home", "title": "Your certificates", "source": "sheet", "csvUrl": "https://docs.google.com/spreadsheets/…output=csv",
  "intervalYears": 10, "weeksBefore": 6,
  "landlord": { "text": "Letting the home? In England the electrics must be inspected and tested at least every five years, and tenants given the report.", "source": "https://www.gov.uk/government/publications/…", "checked": "2026-10-29" } }
```
The landlord line is optional and must come from gov.uk, with the day it was checked; re-check it before each build.
Fails closed: an unknown code, or a sheet that can't be read in 6 seconds, says to message the client. Demos use
`"source": "simulated"` and an `example` code.
