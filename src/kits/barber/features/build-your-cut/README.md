# Build your cut (barber)

| | |
|---|---|
| Feature id | `build-your-cut` |
| Plan | signature and above |
| Config | `services` (`id`, `name`, `price`, `minutes`, `fade`, `kids?`, `buzz?`), `extras` (`adultOnly?`), `staff`, `sections.cut` |
| Files | `build-your-cut.njk`, `build-your-cut.css`, `build-your-cut.js` |

## How it works
A real form (radios, checkboxes, range). `build-your-cut.js` recalculates price/time with `lib/cut.js`, redraws the side-profile diagram (`lib/profile-svg.js`) and rewrites the WhatsApp link with the full order.

## When something is missing or fails
Without JavaScript the form still lists services and prices; the Book button sends a general booking message.

## Notes
Kids' cuts use a child's head and hide adult-only extras. Buzz cuts draw stubble and disable length.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
