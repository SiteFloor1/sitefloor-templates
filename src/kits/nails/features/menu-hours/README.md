# Menu hours

| | |
|---|---|
| Feature id | `menu-hours` |
| Plan | starter and above |
| Config | `menu` (`message`, `bands`: `{ minutes, photo?, items: [{ id, name, text?, price, from? }] }`, `note?`); `sections.menu` |

## How it works
Treatments grouped by how long they take, shortest first: the minutes large, each treatment's name, line and price, and one photograph of the work for the band (desktop only; phones keep the page short).

## When something is missing or fails
Static HTML; nothing to fail.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.
