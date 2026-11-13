# delivery-areas (florist kit, Plus, pages `delivery` and `delivery-<district>`)

Where the florist delivers by hand. Each area is one of `delivery.zones` with its name, a line in the florist's
words, the streets they know (optional), and only where it differs: its own `fee` and its own `cutoffs` for some
days. The index lists every area with its cut-off and charge; each area page has the postcode check, which answers
with that area's cut-off and charge (as does the check on the home page). A collection: one page on the plan's count.

```json
"deliveryAreas": { "title": "Where we deliver", "intro": "…", "how": [{ "q": "…", "a": "…" }],
  "areas": [{ "district": "W8", "name": "Kensington", "line": "…", "fee": 15, "cutoffs": { "mon": "12:00" } }] }
```
