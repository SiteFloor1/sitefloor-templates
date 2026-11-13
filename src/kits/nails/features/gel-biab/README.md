# Gel biab

| | |
|---|---|
| Feature id | `gel-biab` |
| Plan | starter and above |
| Config | `gelBiab` (`options`: 2–4 `{ id, name }`, `rows`: `{ label, values: { <option id>: text } }`, `note?`); `sections.gelBiab` |

## How it works
The most-asked question answered side by side in the salon's words: how long each lasts, what it suits, removal, infills. On phones the table scrolls inside its own box.

## When something is missing or fails
Static HTML.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
