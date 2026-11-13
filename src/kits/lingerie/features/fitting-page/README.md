# fitting-page (lingerie kit, Plus) · `fitting`

The fitting, as a guide and an editorial: the campaign opener, what happens and how a bra should fit (`guides.fitting`
sections, each with an optional photograph), then the size guide, the fit finder (if on) and the request.

Every guide page (fitting, under-the-dress, bridal, for-her, story, fuller-bust, stockings, care, the-lace) reads
the same shape from `guides.<page>`:
```json
"guides": { "fitting": { "kicker": "The fitting", "title": "Forty-five minutes. *The door closed.*", "intro": "…", "description": "…",
  "opener": { "src": "img/…", "width": 1600, "height": 1000, "alt": "…" },
  "sections": [{ "title": "…", "text": "…", "photo": { … } }], "pieces": ["calloway-body"] } }
```
