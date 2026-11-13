# Personal details in your design

| | |
|---|---|
| Feature id | `hidden-details` |
| Plan | signature (a page: `personal.html`; needs `name-find`) |
| Config | `personal`: `message` (WhatsApp opening), `kinds` (2–8 things to hide, e.g. "Our names", "Our wedding date"), `places` (2–8 places, e.g. "The palm", "The fingers"), `text?`; `personalPage`: `{ kicker, title, intro }` |

## How it works
Beside a real finished hand where the name can be found (the hero's palm, magnifier and "Show me"), the bride ticks
what to hide, writes the exact words (names, a date, the city they met in), picks where, and adds her wedding date if
she likes. It all becomes one WhatsApp message, ending "I'll send reference photos here", so the artist gets the
spellings in writing.

## When something is missing or fails
Without JavaScript the form stays and the link sends the artist's opening and a line asking for something personal.

Registered in `src/kits/mehndi/kit.js`. Add to a site by listing the id in `features` in its `site.json`.
