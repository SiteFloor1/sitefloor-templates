# Style guide (barber)

| | |
|---|---|
| Feature id | `style-guide` |
| Plan | plus and above |
| Config | `styleGuide` (`updated`, `reviewedBy?`). Copy lives in `src/kits/barber/data/style-guide.js`. |
| Files | `style-guide.njk`, `style-guide.css`, `style-guide.js` |

## How it works
A whole page (`style-guide.html`). All diagrams are rendered at build time. `style-guide.js` only switches face-shape tabs (arrow keys supported) and highlights the contents list.

## When something is missing or fails
Without JavaScript the first face shape shows and every other section is readable.

## Notes
Sitefloor writes this guide, so it is published under the business's name, never as written by one of its barbers. Set `reviewedBy` ("Danny, senior barber") only after that person has read and approved it.

Good for search: answers questions like "which fade suits a round face".

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
