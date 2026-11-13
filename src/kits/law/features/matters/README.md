# Public matters (Signature)

Work the firm may name: the client approved it in writing and it is already public, with its source. On the home page and each area page.

## Config

```json
"matters": { "title", "intro", "items": [{ "id", "practice", "title", "text", "year", "approved": true, "source": { "name", "url" } }] }
```

Validation refuses unapproved matters and words that promise or boast of outcomes.

Markup is neutral and styled with tokens; each look restyles it (and may override it in `src/looks/<look>/features/`).
