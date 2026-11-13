# Treatments and prices (home)

Each treatment in one line with its "from" (or fixed) price, and who carries it out with their GDC number linked to the register. With the treatment pages on, each name opens its page.

```json
"treatments": { "items": [{ "id": "whitening-home", "name": "Whitening at home", "line": "Trays made for you…", "price": { "from": 395 }, "by": ["<clinician id>"], "whitening": true,
  "visits": [{ "label": "Consultation", "minutes": 45 }, { "label": "Trays fitted", "minutes": 30, "after": 2, "note": "…" }], "page": { "intro": "…", "sections": [{ "heading", "text" }] } }] }
```

A whitening treatment (`whitening: true`) may only be carried out by a dentist, or a hygienist, therapist or clinical dental technician with `prescribedBy` set (src/kits/smile/lib/gdc.js). No shade, permanence, guarantee, painless or laser claims anywhere (`claimProblem`).
