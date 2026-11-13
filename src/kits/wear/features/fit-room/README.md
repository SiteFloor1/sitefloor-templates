# fit-room (Plus) → `fit.html`
Every piece with a `fit` block: pick a size to see its flat measurements and how it sits; "your chest, round" gives the
smallest size whose flat chest × 2 leaves `fit.ease` cm over the body (the brand's own table, nothing guessed); then the
fabric and care in the brand's words. On demos the table says "Example figures".

`pieces[].fit = { ease, measures: [{ id, label, values: { S: 55, … } }], notes: { S: "…" }, chest? }`.
Fabric lines are only what the brand can show from the mill's spec sheet.

## Size finder (optional: `sizeGuide`)
Top of the fit page. The customer gives height (cm, or ft and in), weight (kg, or stone and lb), the size they wear in
a *kind* of brand, how they like it to sit, and their chest if they have a tape. It answers "Try M" with its reasons,
and turns every piece below to that size. It reads **only the brand's own chart**; the chart itself is shown under it
(and is all a visitor sees without JavaScript).

```json
"sizeGuide": {
  "sizes": [{ "size": "S", "height": [165, 174], "weight": [55, 67], "chest": [86, 94] }, …],
  "brands": [{ "label": "Most high-street brands", "shift": 0 }, { "label": "Brands that run small (slim running cuts)", "shift": -1 }],
  "note": "Every shell is cut with room for a midlayer."
}
```
- `sizes`: smallest first, from the brand (cm and kg); `chest` for every size or none. A tape measurement counts most.
- `brands`: kinds of brand only, never a real brand's name; `shift` is how many sizes to move from the size they wear there.
- Demo figures are labelled "Example figures". Piece pages link here ("No tape? Find your size…") when the fit page is on.
