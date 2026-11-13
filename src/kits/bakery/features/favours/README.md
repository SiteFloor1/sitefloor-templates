# Favours (Plus) and "your seal" (Signature)

**Favours** (`favours`, Plus): boxes by the dozen for a wedding, a party or a company. The customer chooses what goes
in each box and how many; the page shows the price per box and in all, the price at the next quantity the shop sets,
and the earliest date it can make them (its notice). The request goes on WhatsApp for the shop to confirm.

**Your seal** (`favour-seal`, Signature): the box lid on the page carries the shop's own seal; the customer types two
initials and a line ("Amira & Sam · 14 June 2027") and the seal is redrawn with them as they type, ring and all. The
seal goes with the request. The look supplies the seal (`src/looks/<look>/parts/seal.njk`); a look without one shows
the lid plain.

```json
"favours": {
  "options": [{ "id": "two", "name": "Two chocolates", "price": 4.5 }, { "id": "four", "name": "Four chocolates", "price": 8 }],
  "minQty": 20, "maxQty": 500, "leadDays": 14,
  "breaks": [{ "from": 100, "less": 0.5 }, { "from": 250, "less": 1 }],
  "note": "Ribbon in your colour on request. Collected, or delivered within Leicester for £15."
}
```

`breaks`: from that many boxes, that many pounds less per box. Prices are the shop's own; nothing is invented. The lid
is drawn (no photo), so it adds nothing to the page's image weight.
