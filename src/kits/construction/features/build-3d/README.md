# The build in 3D, stage by stage (construction kit, Signature)

On How we build: the same procedural house as the visualiser (`../visualiser/house-3d.js`, one shared chunk) shown at
each of the builder's stages: the extension pegged out, the footings, the slab and blockwork with the steel, the roof
on and the glass in, first fix, then finished. Each stage is a button with the builder's own length (`stages.items[].weeks`);
the total shows only when every stage has one. A photograph first; the model loads only on tap.

```json
"build3d": { "title": "The build, *stage by stage*", "intro": "…" }
```

Each stage needs `model` (survey, groundworks, structure, envelope, firstfix, finish), in that order.
