# hair-journal (hair kit, Plus)

The journal (`/journal`) and a page per article (a collection, counted with the journal as one page): the salon's own
dated articles, newest first. An article's `body` is paragraphs with `{ "heading": "…" }` between them; every general
fact (health, products, rules) is linked in `sources` and dated by the article.

```json
"journal": { "title": "Journal", "intro": "…", "items": [{ "slug": "caring-for-colour", "title": "Caring for colour", "date": "2026-09-14",
  "description": "…", "photo": { … }, "body": ["…", { "heading": "At home" }, "…"], "sources": [{ "name": "NHS: Hair dye reactions", "url": "https://www.nhs.uk/conditions/hair-dye-reactions/" }] }] }
```
