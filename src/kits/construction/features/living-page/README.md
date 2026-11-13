# Living through a build (construction kit, Signature)

`living.html`: for families staying at home. The visitor picks a start date; each of the builder's stages shows its
dates (earliest to latest, from the builder's own `weeks`; `lib/programme.js`), what home is like then
(`stages.items[].living.lines`, in the builder's words) and whether it's the noisy part (`living.noisy`). The stage
starts download as one calendar file, marked as estimates. Then the builder's tips.

```json
"livingPage": { "title": "Living through *a build*", "intro": "…", "tips": ["…"] }
"stages": { "items": [{ …, "weeks": [6, 10], "living": { "lines": ["The kitchen moves to the front room."], "noisy": true } }] }
```
Every stage needs `weeks` for the dates; without them the page lists the stages only.
