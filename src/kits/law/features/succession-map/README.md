# Succession map (Signature, page succession)

The firm's own illustration of how an estate can pass through a will or trust, drawn at build time, stepped a generation at a time. Always labelled an illustration; no figures, tax results or promises.

## Config

```json
"succession": { "title", "intro", "note": "An illustration only…", "scenarios": [{ "id", "label", "nodes": [{ "id", "label", "gen": 1, "kind": "person"|"trust" }], "steps": [{ "gen", "title", "text", "flows": [["from", "to"]] }] }] }
```

Checks: src/kits/law/lib/succession.js.

Markup is neutral and styled with tokens; each look restyles it (and may override it in `src/looks/<look>/features/`).
