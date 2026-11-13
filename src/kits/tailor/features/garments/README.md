# garments (tailor kit, Starter)

What the house makes, each with its own "from" price (or `null`: "Priced at your first appointment"), and one
request: a quiet sheet with the garments in mind and when suits, sent on WhatsApp. Never says "booked". Without
JavaScript the button is a plain WhatsApp link with the opening line.

```json
"garments": {
  "message": "Hello Fennick & Lowe, I'd like a first appointment.",
  "items": [{ "id": "suit", "name": "Two-piece suit", "from": 4600, "text": "Coat and trousers" }],
  "times": ["A weekday morning", "A Saturday"],
  "note": "Prices are the house's own; include VAT."
}
```
Heading: `sections.garments`. Prices only ever come from the client.
