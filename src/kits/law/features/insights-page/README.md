# Insights (Plus)

The firm's dated notes, newest first, each on its own page (`insight.njk`, permalink = id) with its author and a not-advice note.

## Config

```json
"insights": { "title", "intro", "items": [{ "id", "title", "date": "YYYY-MM-DD", "author": "<person id>", "practice": "<area id>", "summary", "body": ["paragraph"] }] }
```

Ids become page names, so they can't clash with another page or area.

Markup is neutral and styled with tokens; each look restyles it (and may override it in `src/looks/<look>/features/`).
