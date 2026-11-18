# tourism-checklist (Signature)

Ready to travel (TOUR-8), a page (`ready.html`). First, each country's gov.uk foreign travel advice, linked: we never
summarise or restate it (the build refuses any link that isn't `https://www.gov.uk/foreign-travel-advice/<country>`).
Then the operator's own list to tick before going ("Check your passport has six months left" is theirs to write),
with the month they last checked it. Ticks stay in this browser.

```json
"ready": { "title": "Ready to travel", "intro": "…", "checked": "2026-11",
  "countries": [{ "name": "Chile", "advice": "https://www.gov.uk/foreign-travel-advice/chile" }],
  "items": [{ "text": "…", "when": "When you book" }] }
```
