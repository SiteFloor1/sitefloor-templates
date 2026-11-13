# Probate cost estimator (Signature)

Four answers give an estimate from the firm's published range for one priced service: the published bottom plus each answer's low/high. Validation refuses answers that could reach outside the published range. Shown under that service on the prices page and on its area page.

## Config

```json
"estimator": { "title", "intro", "service": "probate", "note", "questions": [{ "id", "label", "options": [{ "label", "low": 0, "high": 0 }] }] }
```

Markup is neutral and styled with tokens; each look restyles it.
