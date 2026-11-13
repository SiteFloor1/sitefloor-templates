# Your car, in the bay (DET6)

| | |
|---|---|
| Feature id | `car-progress` (also the page `your-car`) |
| Plan | signature |
| Config | `progress`: `source` (`"sheet"`, or `"simulated"` on a demo), `csvUrl`, `staleAfterHours`, `stages` (`[{ id, name }]`, 2–6, in order), `photo` (the studio's bay, shown until a car's own photo), `example?` (demo only); `sections.progress` |
| Files | `car-progress.njk`, `.css`, `.js`, `sheet-provider.js`; logic in `src/kits/detailing/lib/progress.js`; page `src/kits/detailing/pages/your-car.njk` |

## How it works
The code from the booking text opens one car. The stages run as strip lights: done dim, today lit, still to come
off. The studio's latest note sits beside the car's photo, with how long ago it was updated, and the car, the work
and the handover below. A link like `/your-car#VAR0417` opens a car straight away, so the studio can send it.

## The sheet
One row per car: `code`, `car` (a short description: "Green coupé", never a name or registration), `work`, `stage`
(a stage id), `stage_name?` (e.g. "Film" for the protection stage), `note`, `photo` (an https link, e.g. a Google
Drive image), `handover`, `updated_at`. Publish it to the web as CSV. Anyone with the sheet's link can read it, so
it holds nothing private. An unknown code, a stale sheet or one that can't be read shows a plain sentence and no
stage: never a wrong one.
