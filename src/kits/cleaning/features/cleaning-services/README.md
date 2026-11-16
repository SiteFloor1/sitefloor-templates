# Services (cleaning kit, Starter)

Each service the company offers in one line: its name, one sentence, and its hourly rate (`rate`) or a "from" price
(`from`, optional `unit`). With `cleaning-service-pages` (Signature) a service with `page` links to its own page.

```json
"cleans": { "items": [{ "id": "deep-cleans", "name": "Deep cleans", "line": "…", "rate": 30, "page": { "intro": "…", "takes": "…", "sections": [{ "heading": "…", "text": "…" }] } }] }
```
