# What time do we start?

| | |
|---|---|
| Feature id | `bridalbeauty-start` |
| Plan | plus (the easy extra; the full morning is Signature) |
| Config | `morning`: `{ message, ceremony: { default, times }, travelMinutes, dressMinutes, bufferMinutes, earlyStart: { before, fee }, secondArtist?: { earliest, fee }, text? }` |

A cover line: "We start at 7:25 for a 2pm ceremony, four of you". Worked back from the ceremony with the artist's own
minutes: out of the door `travelMinutes` before it, dressed `dressMinutes` before that, `bufferMinutes` spare, the bride
last in the chair (her service's minutes), everyone else before her (each party service's minutes). When the start is
before `earlyStart.before`, the cover names the artist's early-start fee. With `secondArtist`, a second artist joins when
one alone would start before `earliest`, and the line says "two artists". The party size comes from the party quote
(Signature) or is just the bride.
