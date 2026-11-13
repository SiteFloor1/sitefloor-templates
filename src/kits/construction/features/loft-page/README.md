# Your loft in 3D (construction kit, Signature)

A page (`loft.html`) with the same 3D house as the extension visualiser, seen from the roof: a rear dormer, a
hip-to-gable or both, on a terrace, a semi or a detached house, with before and after. The volume the conversion adds
is worked out on the model's own roof (`lib/loft.js`: the dormer's box less the roof it replaces; a gable end less the
equal-pitch hip it replaces) and compared with GOV.UK's Class B allowance in `lib/planning.js`: 40 m³ for a terrace
house, 50 m³ for other houses, earlier roof extensions counted ("already added to this roof"). The other roof rules,
the source with the date checked and "a guide, not a decision" sit under it. The guide works as words and a meter
without the 3D; the model loads on tap (the same chunk as the visualiser, about 130 KB).

The model: a terrace's ends are party walls, a semi is hipped at its outer end, a detached house at both, so a
mid-terrace offers only a dormer and a detached house needs its hips made gables before a dormer fits. The page says
the figures are on the model and that the builder measures the roof at the survey.

```json
"loftPage": { "title": "Your loft *in 3D*", "intro": "…", "photo": { "src": "img/loft.webp", "width": 1200, "height": 800, "alt": "…" },
  "rulesTitle": "The other *rules*", "message": "Hello …, I'd like to talk about a loft like this:" }
```

`message` is the opening of the WhatsApp message; the house, the conversion, the dormer's width and the volume follow.
If GOV.UK changes the roof rules, edit `LOFT` and `LOFT_CHECKED` in `lib/planning.js` (the only copy).
