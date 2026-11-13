# shop-by-occasion (florist kit, Starter)

Shop by occasion and price: birthday, thank you, love, new baby, sympathy… each with the florist's photograph, one
line and the price it starts from. "Up to £…" narrows them to a budget. Each opens WhatsApp with its own message;
an occasion with id "sympathy" goes to the gentle sympathy page instead when `sympathy-order` is on.

```json
"occasions": { "budgets": [50, 75, 100], "items": [{ "id": "birthday", "title": "A birthday", "line": "Bright and generous", "from": 55, "message": "Hello <your shop>, I'd like birthday flowers.", "photo": { … } }] }
```
