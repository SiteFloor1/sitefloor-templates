# General pages

| | |
|---|---|
| Feature id | `custom-pages` |
| Plan | plus and above (or an add-on) |
| Config | `pages`: `[{ slug, title, kicker?, description, intro?, blocks }]` |
| Files | `custom-pages.njk`, `custom-pages.css`; page template `src/core/pages/custom.njk`; checks in `src/core/lib/custom-pages.js` |

## What it's for
The pages every kind of business asks for that aren't a feature of their own: About us, Services,
Gift vouchers, Events, Private hire. Each page is built from four kinds of block, so it always matches
the rest of the site and nobody hand-codes a page for one client:

- `text`: `heading?`, `body` (leave a blank line between paragraphs)
- `photo`: `src` (a WebP in `img/`), `alt`, `caption?`
- `list`: `heading?`, `items`
- `book`: `text`, `label?`: a line and the site's Book button

```json
"pages": [{ "slug": "about", "kicker": "Since 2014", "title": "About|the shop*.*",
  "description": "How the shop started and how we work.",
  "blocks": [{ "type": "text", "heading": "How it started", "body": "Para one.\n\nPara two." }] }]
```

Add a nav item `{ "label": "About", "page": "about", "feature": "custom-pages" }` to link it.

## Rules
- Each page counts towards the plan's page limit (Plus: 5 including home). Extra pages are sold one at a time: set `addonPages` to the number bought, and the limit grows by that many.
- Slugs are lowercase words with dashes and can't reuse a page every site has (`privacy`, `visit`, …).
- `description` is the one sentence Google shows, up to 160 characters.
- Words come from the client. Don't write history, numbers or claims they haven't given you.
