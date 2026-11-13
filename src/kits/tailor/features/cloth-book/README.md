# cloth-book (tailor kit, Plus)

The cloth book, opened: each cloth a tall length (photo at 2:5) hanging from one spine at its own width and `drop`,
pinked at the foot. Tap one: its weave fills the screen (`weave`, 16:10; `weavePhone`, 4:5) with cloth, weight and
season, previous/next, and "Ask for a swatch" (a pre-filled WhatsApp message with the cloth's name). Without
JavaScript each length links to its weave photograph. On phones the book scrolls sideways inside itself.

```json
"cloths": {
  "message": "Hello Fennick & Lowe.",
  "note": "Demo cloths…",
  "items": [{ "id": "midnight", "name": "Midnight", "cloth": "Worsted", "weight": 260, "seasons": ["all-year"], "drop": 0.86,
    "length": { "src", "width", "height", "alt" }, "weave": { "src", "width", "height" }, "weavePhone": { "src", "width", "height" } }]
}
```
`seasons`: all-year, spring, summer, autumn, winter. `weight` (grams per metre) only if the house gives it. Heading:
`sections.cloth`. No mill names or logos unless the house sells that mill's cloth and says so in plain words.
