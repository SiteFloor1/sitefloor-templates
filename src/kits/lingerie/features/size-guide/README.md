# size-guide (lingerie kit, Starter)

The shop's size range as a grid (UK bands down, cups across), each cell marked on the shelf, ordered in, or not
made, with how its fitters measure and one line of the shop's own. It never works out a size: the fitters do.

```json
"sizeGuide": { "bands": [28, 30, 32, 34, 36, 38, 40], "cups": ["A", "B", "C", "D", "DD", "E", "F", "FF", "G"],
  "stock": { "bands": [30, 38], "cups": ["A", "G"] }, "order": { "bands": [28, 40], "cups": ["A", "G"] },
  "how": ["…"], "note": "…" }
```
Heading: `sections.sizeGuide`. Logic: `sizeGrid` in `src/kits/lingerie/lib/fit.js`.
