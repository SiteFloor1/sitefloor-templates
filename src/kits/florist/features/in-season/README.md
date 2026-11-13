# in-season (florist kit, Plus)

In season now: what's in the studio this week, each stem with the florist's own word: just in, plenty or last week.
With `studioSheet.source: "sheet"`, rows `season,<stem id>,<word>` change the words without a rebuild; a broken or
missing Sheet keeps the list written here, never an empty one.

```json
"inSeason": { "note": "British-grown where we can.", "photo": { … }, "items": [{ "id": "dahlias", "name": "Dahlias", "status": "last-week" }] },
"studioSheet": { "source": "sheet", "csvUrl": "https://docs.google.com/spreadsheets/d/e/…/pub?output=csv" }
```
