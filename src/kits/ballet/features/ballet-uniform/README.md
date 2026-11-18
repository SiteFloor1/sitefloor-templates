# What to wear

| | |
|---|---|
| Feature id | `ballet-uniform` |
| Plan | plus and above |
| Config | `uniform`: `photo`, `sets` `[{ id, name, classes: [class ids], items: [{ name, note? }] }]`, `shop?` `{ label, url }`, `note?`; `uniformPage` `{ kicker, title, intro }`; heading in `sections.uniform` |
| Files | `ballet-uniform.njk` (home section and the uniform page), `ballet-uniform.css`, `ballet-uniform.js` |

## What it does
Each class's kit as a ruled list, the class names as tabs above it (arrow keys move between them), and the school's
supplier as one link. The same section opens the uniform page. Every list is in the HTML, so it reads without
JavaScript and prints.

## Rules
- The lists, colours and supplier are the school's. No prices unless the school gives them (put them in `note`).
