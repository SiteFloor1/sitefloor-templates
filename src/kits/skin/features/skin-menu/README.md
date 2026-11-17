# Treatments by concern and by time (BEAU-1, Starter)

The clinic's `menu`, grouped by treatment (`menu.categories`). One tap lists it by concern (each word in an item's
`concerns`, as the clinic uses them: "tight", "tired") or by time (under an hour, an hour, longer). Each row: the
treatment's name, its minutes and price (`from: true` for a "from" price). With the category pages on, a category's
name opens its page. Every list is in the page; without JavaScript the menu shows by treatment.

```json
"menu": { "categories": [{ "id": "facials", "name": "Facials", "page": { "title": "Facials", "intro": "…" },
  "items": [{ "id": "hydrating", "name": "Hydrating facial", "minutes": 60, "price": 95, "line": "…", "concerns": ["tight"],
    "afterwards": "…", "patch": "…", "evening": "…", "rhythm": { "everyWeeks": 5, "reminders": [{ "id": "spf", "afterDays": 1, "label": "…" }] } }] }] }
```
