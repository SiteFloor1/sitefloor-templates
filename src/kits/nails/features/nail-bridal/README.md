# Bridal page

| | |
|---|---|
| Feature id | `nail-bridal` |
| Plan | plus and above |
| Config | `bridal` (`message`, `text`, `steps`: `{ id, label, daysBefore, text? }`, `photo?`); `bridalPage` |

## How it works
The trial and the final set in the salon's words, its timings ("Six weeks before: your trial") and a request. The look moves the timeline and parties here.

## When something is missing or fails
Static HTML.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
