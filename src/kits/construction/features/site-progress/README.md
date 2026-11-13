# Your house, this week (construction kit, Signature)

The client portal without accounts. Each client gets a site code (8–12 letters and digits, so it can't be guessed).
They type it in the strip under the home hero, in the header's "Site code", or follow the link the builder sends
(`your-build.html#CODE`), and see the stage their build has reached, this week's work in one line, a photograph and
what happens next.

The builder keeps one Google Sheet, published as CSV, with exactly these columns:

| code | stage | updated_at | done | next | photo |
|---|---|---|---|---|---|
| PG4K7M2Q | envelope | 2026-11-02 16:10 | The roof structure is up. | Roofer on site Monday. | a Google Drive share link |

- **Private by design.** A published sheet can be opened by anyone with its link, so it holds no names, addresses,
  door codes or anything else. A sheet with anything in any other column is refused as unreadable. The photo is a
  Google Drive share link ("anyone with the link"); the page shows only Drive's thumbnail, and the site's security
  policy allows only Drive.
- **Fails closed.** An unreadable sheet, an unknown code, a stage the site doesn't list or an update older than
  `staleAfterDays` says to call. Lines longer than 240 characters are cut.
- `stage` uses the ids of `stages.items`. A demo uses `"source": "simulated"` and an `example` code.

```json
"siteProgress": { "title": "Your house, *this week*", "intro": "…", "source": "sheet", "csvUrl": "https://docs.google.com/spreadsheets/d/e/…/pub?output=csv", "staleAfterDays": 10 }
```
