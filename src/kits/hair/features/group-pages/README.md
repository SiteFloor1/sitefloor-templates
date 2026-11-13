# group-pages (hair kit, Plus)

A page for each kind of service the salon chooses (a collection, counted as one page): its photograph and line, the
group's prices by length and level (the shared price grid), a few notes in the salon's words, the stylists whose
`does` includes the group, and "Ask on WhatsApp".

```json
"groupPages": { "items": [{ "group": "cuts", "slug": "cuts-and-styling", "title": "Cuts and styling",
  "description": "…(160 characters at most)", "intro": "…", "photo": { "src": "img/cutting.webp", "width": 960, "height": 1200, "alt": "…" },
  "notes": ["…"] }] }
```
Link each page in `nav` with `"feature": "group-pages"`.
