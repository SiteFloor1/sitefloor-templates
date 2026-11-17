# ifa-fees (IFA-2, Plus)

`fees.html`: the firm's published schedule in words (from the numbers, so words and sums never disagree), the
`presets` worked in pounds, what the yearly fee buys, how the firm is paid, VAT, and platform and fund charges.

```json
"fees": {
  "intro": "…",
  "schedule": { "initial": { "rate": 1.5, "min": 1500 }, "ongoing": { "rate": 0.75 }, "from": 50000, "to": 5000000 },
  "example": 250000, "presets": [100000, 250000, 500000],
  "includes": ["…"], "paid": "…", "vat": "…", "other": "Platform and fund charges are separate…",
  "extras": [{ "label": "One-off advice, no ongoing service", "fee": "From £1,200, agreed in writing first" }]
}
```
A charge is `{ rate }`, `{ tiers: [{ upTo, rate }, …, { rate }] }` or `{ fixed }`, each with optional `min`/`max`
(`lib/fees.js`). Arithmetic on the firm's own fees only: no returns, no growth, no projections.
