# Planning guide on the 3D model (construction kit, Signature)

On the visualiser page, under the 3D house: as the visitor changes the house type and the depth, a marker moves along
three bands (permitted development, prior approval, planning permission) and one sentence says where this rear
extension sits; the same two depths are drawn across the model's garden as dashed lines. Then the other conditions
(height, eaves near the boundary, materials, earlier extensions, flats, conservation areas), the source and the date it
was checked, and "A guide, not a decision. Check with your council or apply for a lawful development certificate."

Every figure comes from `lib/planning.js`, which holds the GOV.UK wording, the page links and the date checked; change
the rules there only. These are England's rules.

```json
"planningGuide": { "title": "Against the *planning rules*", "intro": "…" }
```
