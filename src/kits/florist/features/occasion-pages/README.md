# occasion-pages (florist kit, Plus, pages `occasions` and `for-<id>`)

A page per occasion: the florist's photograph, an intro in their words, up to four pieces with their prices (each
opens WhatsApp with the occasion's message and the piece), up to six lines for the card, and the same-day line. If a
pre-order window names the occasion (`preorder.windows[].occasion`), its order-by date shows only between the window's `opens` and `orderBy` dates (checked again in the browser,
so a page built earlier never shows a window that isn't open). The
home page's "shop by occasion" links to these pages when ids match. The index also links sympathy and funeral flowers
when those are on. A collection: one page on the plan's count however many occasions.

```json
"occasionPages": { "title": "Flowers for the day", "intro": "…", "pages": [{ "id": "birthday", "title": "Birthday",
  "line": "…", "intro": "…", "photo": { … }, "message": "Hello <your shop>, birthday flowers:",
  "items": [{ "name": "The birthday bunch", "price": 55, "line": "…" }], "words": ["Happy birthday, with love"] }] }
```
