# Feature: handover (hire kit)

The brand moment on the home page: the car delivered to your door at night and the key passed over, with the client's
delivery window, collection and how the deposit is taken and returned. **Plan:** Starter (a still scene).

On Signature, `delivered-tonight` turns the same scene into the request (see its README).

Config: `hire.handover` `{ door, doorTall, key, window }` (photos `{ src, width, height, alt }`; `window` in the
client's words), `hire.delivery.collect`, `hire.deposit` `{ how, when }`, `sections.handover` `{ title, intro? }`.
