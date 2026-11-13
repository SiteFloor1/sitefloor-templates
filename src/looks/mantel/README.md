# Mantel (florist look)

A florist's flowers in bright, grand rooms. Flowers first: this week's arrangement fills the screen edge to edge with
no words on it. The page stays pale and quiet (stem-white #F7F6F3, warm ink #1C1B19) so the flowers' colour does the
work. One idea: **the site takes its accent from this week's flowers**. The florist sets a colour sampled from the
week's arrangement (one row in `site.json` or their Google Sheet); the build mixes it into three tokens:

| Token | Used for |
|---|---|
| `--week` | the seal's outer ring, the dots, the card's top edge, swatches |
| `--week-deep` | the one filled button, the chosen size's outline, the phone bar (always AA with white text) |
| `--week-wash` | this week's band beneath the hero |

Everything else is ink on stem-white. Type: Hedvig Letters Serif (names, prices, headings) and Hedvig Letters Sans
(everything else), both 400; contrast comes from size (74px names against 14px labels). Controls are square and fine:
outlined in ink, a filled button only for the order. Motion: the hero fades in once; nothing is tied to scrolling.

**Header:** the seal (a fine double ring like a pressed stamp, outer ring in the week's colour, the initial in the
serif, a stem at the foot), the name with "Flowers, Pimlico" beneath, the pages centred, a square Order.
**Home:** hero → this week's band (dots, name, stems, sizes, same-day line, postcode check, the card, one button) →
in the room / to your door → the wrap → shop by occasion → in season → rooms we dress (tabs; a sideways strip on
phones). Remember the date, gift a season and vouchers move to "Every week"; reviews and questions to "Plan your
visit"; the gallery to "Work"; the photo band to "Weddings", so the home page stays short.
**Footer:** the seal large, address, studio hours, same-day delivery days, pages, the Sitefloor credit.
**Phone bar:** a block in the week's deep colour: today's delivery state and Order. The page keeps space beneath it.

Design record: `sitefloor-internal/docs/design/florist.md`. Photographs: one bright grade (saturation ×1.05, lifted shadows, no near-black).
