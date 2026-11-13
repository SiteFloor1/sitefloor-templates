# Private client guides (Signature)

Longer pieces for families, each dated and reviewed by a named solicitor, on its own page (`guide.njk`).

## Config

```json
"guides": { "title", "intro", "items": [{ …as insights…, "reviewedBy": "<solicitor id>", "reviewed": "YYYY-MM-DD" }] }
```

Markup is neutral and styled with tokens; each look restyles it (and may override it in `src/looks/<look>/features/`).
