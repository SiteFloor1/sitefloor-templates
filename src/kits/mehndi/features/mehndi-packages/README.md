# Packages

| | |
|---|---|
| Feature id | `mehndi-packages` |
| Plan | starter and above |
| Config | `packages`: `message` (WhatsApp opening), `label?` (the list's heading, default "For the bride"), `items` (1–6: `{ id, name, text, hours, price, from? }`), `photos` (1–2 tall photos of bridal mehndi with the jewellery), `wide?` (one wide photo under them), `note?`; heading in `sections.packages` |

## How it works
Bridal mehndi by how far it goes. Each package is one ruled line: its name, then what it covers, the hours and the
price ("from £220" when `from` is true), all in the artist's words. Beside it, the bride from the wrist down: her
hands, chooda, kaleere and fabric, never her face. The one action goes to the date check when it's on, otherwise to
WhatsApp with the artist's opening.

## When something is missing or fails
Nothing is live. Prices and hours are the artist's; a demo marks its figures as examples.

Registered in `src/kits/mehndi/kit.js`. Add to a site by listing the id in `features` in its `site.json`.
