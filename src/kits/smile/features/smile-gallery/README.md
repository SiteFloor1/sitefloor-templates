# Smile gallery (Signature)

The studio's own patients, close and large, each with the treatment and the clinician. A client's photo needs the consent the studio recorded (`consent.date`, `consent.ref`, never published) and `consent.retouched: false`; a `before` is only of the same person. A demo may use stock photographs with `model: true`, labelled "A model photograph, not a patient" and never with a before.

```json
"smiles": { "title", "intro", "items": [{ "id", "photo": { … }, "before": { … }, "treatment": "<id>", "by": "<clinician id>", "consent": { "date": "2026-10-02", "ref": "C-114", "retouched": false }, "caption" }] }
```
