# How a build runs (construction kit, Starter)

The builder's stages in a ruled list (name and one line each) beside two photographs stacked like a section through a
house: the finished room above a ground line, the same kind of job during the build below it. Links to How we build
when that page is on.

```json
"stages": {
  "title": "How a build *runs*", "intro": "One project manager from survey to handover, and a written update every week.",
  "above": { "src", "width", "height", "alt" }, "below": { "src", "width", "height", "alt" },
  "items": [{ "id": "survey", "name": "Survey", "line": "Measured, drawn and priced before anything starts.", "model": "survey", "weeks": [2, 4], "about": ["…"], "photo": { … } }]
}
```

Three to seven stages. `weeks` (fewest and most, from the builder's own jobs), `about` and `photo` are for How we build;
`model` is what the 3D build shows at that stage (survey, groundworks, structure, envelope, firstfix, finish). The
stage ids are also what the builder's sheet uses for "your house, this week". Markup uses tokens only.

**If we started in…** When every stage has `weeks`, a month picker (the next twelve months) gives the handover months
from the builder's own lengths: earliest if every stage runs at its fewest weeks, latest at its most (`lib/programme.js`).
Arithmetic on the builder's figures, never a promise; nothing shows without them.
