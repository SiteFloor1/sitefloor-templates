# Journal (construction kit, Signature)

`journal.html` and a page for each article (one collection, counted as one page): the builder's own writing, dated and
signed (planning an extension, living through a renovation, choosing materials). Any fact about planning permission,
permitted development or building regulations links to its GOV.UK page with the date it was checked (`sources`); the
build refuses a source that isn't gov.uk. Articles are never filler: no article, no journal.

```json
"journal": { "title": "Journal", "items": [{ "id": "planning-an-extension", "title": "…", "date": "2026-10-12", "author": "…", "summary": "…", "photo": { … }, "body": ["…"], "sources": [{ "label": "Planning permission: extensions", "url": "https://www.gov.uk/…", "checked": "2026-11-04" }] }] }
```
