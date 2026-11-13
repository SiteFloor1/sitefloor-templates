# Feature: parties (bakery kit, Plus, page `/parties`)

Parties and groups page: the shop's options (photo, what's included, price a head or a set price, smallest group,
notice), a party calculator (guests → the cheapest one or two items from the shop's `servings` list that serve
everyone, one portion each as the shop cuts them), an enquiry on WhatsApp with the suggestion, and the deposit.

```json
"parties": {
  "options": [{ "id": "birthday-table", "name": "A birthday table", "text": "…", "perHead": 16, "minGuests": 8, "notice": 5, "photo": { … } }],
  "servings": [{ "id": "s8", "name": "8 inch cake", "servings": 20, "price": 68 }],
  "maxGuests": 150, "note": "…", "depositLink": "party-deposit"
}
```

Page copy: `partiesPage`.
