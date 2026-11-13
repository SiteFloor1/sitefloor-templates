# Practice index (home)

Each practice area set large as a ruled index with its one line. Links to the practice page (Plus) or the area's own page (Signature).

## Config

```json
"practice": { "photo": { "src", "width", "height", "alt", "position" }, "items": [{ "id", "name", "line", "about", "does": [], "lead": "<person id>", "sraServices": ["probate"] }] }
```

`sraServices` lists the services from SRA Transparency Rules rule 1 the area offers; any listed means the `pricing` page must be on and price each one.

Markup is neutral and styled with tokens; each look restyles it (and may override it in `src/looks/<look>/features/`).
