# Shapes page

| | |
|---|---|
| Feature id | `shapes-page` |
| Plan | plus and above |
| Config | `shapes.items` (`shape`, `text`, `suits`, `art?`: the id of a set in that shape); `shapesPage` |

## How it works
Each shape the salon files and what it suits, shown on one of its real sets in that shape (never a drawing).

## When something is missing or fails
Static HTML.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
