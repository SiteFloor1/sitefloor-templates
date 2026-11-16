# trainer-programmes (Plus, page `programmes` + a page per programme)

The kinds of training the trainer is qualified for, each on its own page (`programme-<id>`). The Programmes page also
holds the goal finder when `trainer-goal` is on.

```json
"programmes": {
  "title": "Programmes", "intro": "…",
  "items": [{
    "id": "strength", "kind": "strength", "name": "Strength", "line": "One line", "who": "Who it's for",
    "text": ["Paragraph", "…"], "sessions": ["Lower body strength", "Upper body and core", "Conditioning"],
    "photo": { "src": "img/strength.webp", "width": 933, "height": 1400, "alt": "…" },
    "qualification": "Level 3 Diploma in Personal Training"
  }]
}
```

Honesty, checked in `config.js`: `kind` "prenatal" and "rehab" need `care` (who the trainer works alongside: the
client's GP, midwife or physio) and a `qualification` that is in `qualifications.items`. A rehab programme never says
the sessions treat, fix or cure anything. Nothing promises results (the kit's copy check runs over every field).
