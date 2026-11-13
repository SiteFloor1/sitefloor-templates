# WhatsApp quote

| | |
|---|---|
| Feature id | `quote` |
| Plan | starter and above |
| Config | `quote`: `{ "message": "Hi, can I get a quote?", "options": ["Window tint", "Wrap", …] }`; `vehicles`; `sections.quote` |
| Files | `quote.njk`, `quote.css`, `quote.js` |

## How it works
The visitor picks a vehicle size, types the make and model, ticks the work they want and a week that suits them.
The button opens WhatsApp to the studio's number with all of it written out, ready to send (photos can be added
in WhatsApp). Nothing is sent or stored by the site.

## When something is missing or fails
Without JavaScript the form still shows and the button opens WhatsApp with the opening line only.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
