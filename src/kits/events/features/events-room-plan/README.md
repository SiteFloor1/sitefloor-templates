# events-room-plan (Signature)

Your room, drawn (`your-room.html`, EVT-7): the agency's rooms (`roomPlan.rooms`: `{ id, name, length, width, note? }`
in metres, from each venue's plan), guests 10–400 and long tables, rounds of ten or standing. The plan is drawn to
scale as SVG (on first paint at `roomPlan.start`, then in the browser): tables and chairs, a dance floor when the room
is long enough, the bar, a scale in metres. Spacing rules are in `lib/events.js` (`drawRoom`). It says when a number
won't fit and always says it's a guide: the venue's own capacity and rules decide. Drawn, never 3D in the browser.

A link can open it set up: `your-room.html#room=<id>&guests=<n>&layout=<long|round|standing>` (the proposal does).
