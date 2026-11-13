# Feature: desserts (bakery kit, Starter)

The dessert menu on the home page: every section and item with its price, description, diet marks (eggless, vegan,
halal, vegetarian) and the FSA's 14 allergens from the shop's own chart; filters for the marks and "hide anything
containing…"; tonight's "a few left" and "sold out" from the sheet (with `bakes`). The shop's allergen statement and
"Please tell us about any allergy when you order" under every list. Without JavaScript everything is listed.

Config: `desserts` (shared with `bakes`, `dessert-menu`, `collect`, `dessert-box`):

```json
"desserts": {
  "statement": "Our kitchen handles nuts, peanuts, sesame…",
  "chartChecked": "2026-10-26",
  "sections": [{ "id": "counter", "name": "From the counter", "intro": "…", "items": [
    { "id": "pistachio-kunafa", "name": "Pistachio kunafa", "desc": "…", "price": 8.5,
      "allergens": ["gluten", "milk", "nuts"], "diets": ["eggless", "halal", "vegetarian"],
      "photo": { "src": "img/kunafa.webp", "width": 1000, "height": 1250, "alt": "…" },
      "counter": true, "box": true, "takeaway": true, "signature": true }
  ]}]
}
```

- `allergens`: ids from `src/core/lib/allergens.js`, `[]` if none (never left out). The site never calls anything safe.
- `diets`: `eggless`, `vegetarian`, `vegan`, `halal`, from the shop. A vegan item also counts as eggless and vegetarian
  in the filters. Refused: vegan with milk, eggs, fish or shellfish; eggless with eggs.
- `counter` puts it on tonight's counter (and the hero list), `box` in the dessert box (needs a photo), `takeaway` in
  collection requests. Heading: `sections.desserts`.
