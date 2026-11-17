# modest-eid (Plus)

Eid last order dates (MOD-5), a home section: "Eid al-Fitr is expected between 8 March 2027 and 12 March 2027, when
the moon is sighted." Then each of the shop's cut-offs counted back from the first day of that window, with the days
left ("UK delivery · Order by Monday 1 March 2027 · in 12 days"); a cut-off that has passed says closed.

- The windows come from the shared lunar table (`src/core/lib/seasons.js`, Eid al-Fitr and Eid al-Adha, always
  "expected"); the shop gives only its cut-offs, as days before. Counting back from the window's first day keeps every
  promise on the safe side of the moon sighting.
- Worked out in the browser on the day; if the table holds no Eid ahead, the section hides itself (never a guessed date).
- Heading: `sections.eid`. With `modest-family` on, it links to the family list.

```json
"eid": { "cutoffs": [{ "label": "UK delivery", "daysBefore": 7 }, { "label": "Alterations", "daysBefore": 14 }], "note": "…" }
```
