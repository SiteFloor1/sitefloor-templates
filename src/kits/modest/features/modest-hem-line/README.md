# modest-hem-line (Signature)

The hem line (MOD-9), once on the home page: "Shoulder to floor, 57″ [−][+], in 2″ heels." She taps the measurement or
the shoes; the shop's length that clears the floor comes back in the display face ("Wear the 58. It stops 1″ above the
floor in 2″ heels."). Beside a real hem photograph a ruler shows the last inches to scale: each of the shop's lengths
that reaches no further than the floor, the floor itself, and the gap. "Only know your height?" opens the shop's chart
(`modest-size-guide`). The answer also sets the length in the look bar (`modest-look`).

Heading: `sections.hemLine`. Settings:

```json
"lengths": {
  "sizes": [52, 54, 56, 58, 60],
  "clear": 0.5,
  "chart": [{ "height": "5′5″ to 5′7″", "from": 56.5, "to": 58, "length": 56 }],
  "shoes": [{ "label": "flats", "heel": 0 }, { "label": "2″ heels", "heel": 2 }],
  "start": { "shoulderToFloor": 57, "shoe": 1 },
  "measure": "Stand straight in bare feet; measure from the top of the shoulder, beside the neck, to the floor.",
  "takeUp": "Between lengths? We take any abaya up for you before it's sent."
},
"hemLine": { "photo": { "src": "img/hem.webp", "width": 1100, "height": 849, "alt": "…" }, "credit": "Hem photograph: …" }
```

- A length fits when it clears the floor by `clear` inches or more (½″ if left out); the longest that does is chosen.
- `start.shoe` picks the shoes the tool opens on: match the hem photograph (the demo's is in heels, so it opens on 2″ heels).
- Every chart row, length and line is the shop's own; the kit only does the sums (`lib/modest.js`, unit-tested).
- Without JavaScript the chart shows in place of the sentence.
