# events-visuals (Signature)

See your room before the day: the agency's design visuals of a proposed room (renders or styled photographs of a
mock-up), one to four views of one set, the first large and the others a click away. Every view carries "A design
visual": this is what a room could look like, never a past event, and `config.js` refuses a visual that is also used as
a room or in a case study. The home page shows `visuals.home`; the proposal page shows the set its code names.

```json
"visuals": { "home": "green-hall", "credit": "Design visuals: renders.", "sets": [{ "id": "green-hall",
  "title": "Proposed: dinner for twenty.", "line": "One long table in a panelled hall…", "views": [{ "label": "From the door", "photo": { … } }] }] }
```
