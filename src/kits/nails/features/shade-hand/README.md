# Shade hand

| | |
|---|---|
| Feature id | `shade-hand` |
| Plan | starter and above |
| Config | `hero` (`kicker`, `title`, `hands`: each `{ id, label, src, width, height, alt, wearing, mask?, shots? }`), `shades` (`items`, `rail?`) |

## How it works
The hero shows a hand; the rail under it holds the salon's shades as flat swatches. On every plan, a swatch with a photo (`shots`: the same hand photographed in another shade) cross-fades the hand to it. The card (number, name, system and finish) and every Book in the shade's colour (header, card, phone bar) follow, and the WhatsApp message names the shade. Markup is the look's `hero.njk`.

## When something is missing or fails
Without JavaScript the hand stays in the shade it was photographed in and Book sends the menu's message. A photo that won't load leaves the hand as it was; the card still changes.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
