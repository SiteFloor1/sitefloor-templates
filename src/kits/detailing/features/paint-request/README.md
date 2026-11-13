# Send us your paint (DET8)

| | |
|---|---|
| Feature id | `paint-request` |
| Plan | signature |
| Config | `paintRequest`: `message` (the WhatsApp opening line), `concerns` (choices, e.g. Swirls, Stone chips), `photos` (2–6: the photographs to send, in order), `photo?`; `sections.paintRequest` |
| Files | `paint-request.njk`, `.css`, `.js`; the message in `src/kits/detailing/lib/packages.js` (`paintText`) |

## How it works
The car, its colour, what bothers the visitor and where it's kept go into one WhatsApp message, with the studio's
list of photographs to send next in the same chat (a pre-filled link can't attach photos). The studio replies with
what the paint needs. Nothing is stored; the form's answers are in the message only.
