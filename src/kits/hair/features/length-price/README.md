# length-price (hair kit, Starter)

Price by length and stylist level, as the home page's opening. One landscape photograph of the salon fills the first
screen, a client in the chair with long hair from behind; a mark for each length runs down a measuring tape on the
left, and tapping one glides a fine line to it while the hair below fades softly, in place, to a faint trace (about
0.8 s; going longer it fades back). Only the hair fades, because the hair below the shoulder is its own layer, cut by
hand from the same photograph, over a plate of the photograph with that hair taken out. Nothing falls or tilts. The price and time ride the cut
line on a tag; the service and level choices, the headline and the WhatsApp link sit on the photograph, and with
`chairs-today` in the look's `heroParts`, chairs free today sits there too. Never says "booked".

Without JavaScript: the photograph at the default length, the default price, and "Every price" to the services page.
Reduced motion: the line and the hair change at once.

```json
"hero": { "title": "Priced by your length.", "intro": "…", "cut": {
  "plate": { "src": "img/cut-plate.webp", "phone": "img/cut-plate-1200.webp", "width": 2000, "height": 1335, "alt": "…" },
  "hair": { "src": "img/cut-hair.webp", "phone": "img/cut-hair-1200.webp", "width": 2000, "height": 593, "top": 0.337 },
  "marks": { "short": 0.37, "shoulder": 0.46, "mid": 0.58, "long": 0.78 }, "focus": 0.617 } },
"menu": { "message": "Hello …, I'd like to book.", "lengths": […], "levels": […], "groups": […], "services": […],
  "hero": ["cut", "roots", "balayage"], "defaults": { "service": "cut", "level": "senior", "length": "long" }, "note": "…" }
```

- `hair.top` is where the hair layer starts on the plate (a share of its height); the layer is as wide as the plate.
- `marks` are where each length falls on the photograph, shortest first; validation refuses them out of order.
- `focus` is where the hair is across the photograph (0 left, 1 right): a phone shows a narrow slice centred there.
- Choose a landscape photograph with room on the left for the words and on the lower middle for chairs free today.
- Prices are per level: one per length (shortest first) or one for any length; `null` reads "Priced at a free
  consultation". Times are one number or one per length. All of it is the salon's own.
- Making the two layers for a client's photograph: trace the hair below the shoulders by hand, key it against the gown,
  fill the gown under it, and check that the plate and the hair put back together match the photograph. The demo's
  files are in `sites/demos/hair/img/` (credits there).
- With `my-usual` on (Plus), "Keep as my usual" stores the service, level and length on the visitor's phone
  (`localStorage`, nothing sent anywhere); the price opens on it next time.
