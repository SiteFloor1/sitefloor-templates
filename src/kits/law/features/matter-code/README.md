# Your matter, by code (Signature, unlisted page `your-matter`)

The stage a matter has reached from the firm's published Google Sheet. The sheet must hold only `code,stage,updated_at`: a random 8–12 character code, a stage id and a time; never names or details (a published sheet is public). A sheet with anything in any other column, headed or not, is refused and the page says to call. Unknown, stale or unreadable says to call. Offer only if the client is comfortable with a published sheet.

## Config

```json
"matterCode": { "title", "intro", "source": "sheet" | "simulated", "csvUrl", "staleAfterDays": 14, "stages": [{ "id", "name", "about" }], "example": "<demo only>" }
```

Markup is neutral and styled with tokens; each look restyles it.
