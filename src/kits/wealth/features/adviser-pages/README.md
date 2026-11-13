# Each adviser's own page (Signature, a collection counted as one page)

A page per adviser in `advisers.items`: a photograph (at a distance or a portrait, optional), their role and note,
what they look after (their `leads`, linked to those moments), their FCA reference with a link to check it on the
register, their direct line and email, and a booking link. `book` is the adviser's own booking page (https); without
it the link opens the meeting page with them already chosen (`#with-<id>`), or calls them when that page is off.

```json
"advisers": { "items": [{ "id", "name", "role", "irn", "leads": ["…"], "note", "phone", "email", "photo": { … }, "book": "https://…" }] }
```
