# sympathy-order (florist kit, Plus, page `sympathy`)

Sympathy and funeral flowers, gently: the florist's pieces with starting prices, who they're in memory of, where they
go (the florist's own list: the funeral director, the service, a home), the day of the service (a day sooner than
`leadDays` is still sent, with an honest word) and plain words for the card. Sent on WhatsApp so the florist can
confirm by name. No countdowns or offers on this page.

```json
"sympathy": { "title": "Sympathy flowers", "intro": "…", "leadDays": 2, "message": "Hello <your shop>, I'd like to order sympathy flowers.",
  "note": "We'll confirm by message before anything is made.", "places": ["The funeral director", "The service", "A home"],
  "cardLines": ["With deepest sympathy.", "Thinking of you all."], "pieces": [{ "id": "tribute", "title": "A tribute", "line": "…", "from": 85, "photo": { … } }] }
```
