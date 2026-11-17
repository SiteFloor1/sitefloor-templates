# modest-family (Signature)

The Eid family list (MOD-11), its own page (`/eid`): the Eid last order dates (`modest-eid`, needed), then one list
the family fills in: each person's name, piece (from `family.pieces`) and length (or "Not sure"), with the total.

- The list lives only in the page's address (`#name~piece~length|…`): "Send the list to the family" shares the link
  (or copies it), each person adds themselves, and nothing is stored anywhere. Names are cut to 24 letters, at most
  `max` people (8 if left out).
- "Send our order" opens WhatsApp with every line and the total; the shop confirms sizes and payment by message.
- Below: the Eid edit, every piece with `"eid": true`.

```json
"family": { "pieces": ["layl", "sahar", "misk", "jersey-hijab"], "max": 8, "intro": "…" }
```
