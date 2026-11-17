# modest-fabrics (Signature, client-only)

The fabric library (MOD-8), its own page (`/fabrics`): the shop's own close-up of each cloth with its line, weight and
care. It needs the shop's own photographs of its own cloth (a stock photo of someone else's fabric would mislead), so
it is client-only: no demo turns it on; the client fixture `test-modest-client` shows it.

```json
"fabrics": { "title": "The fabrics", "intro": "…", "items": [{ "name": "Nida", "line": "…", "weight": "Light",
  "care": "Cool hand wash", "photo": { "src": "img/nida.webp", "width": 1000, "height": 1000, "alt": "…" } }] }
```
