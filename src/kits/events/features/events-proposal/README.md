# events-proposal (Signature)

Your proposal, by code: a private page (`your-proposal.html`, kept out of the sitemap and search; free, like Plan your
visit). The agency sends a link ending `#CODE` (or the client types the code): the page shows the set of design visuals
the proposal names (`visuals.sets`), the date and the days to go, the guests and how they sit, and a link to the room
drawn (with `events-room-plan` on) and the sample run of the night.

The agency's sheet, published as CSV, holds only: `code, visuals, room, guests, layout, date, updated` (visuals a set
id, room a `roomPlan.rooms` id or blank, layout long/round/standing, guests a whole number or blank, dates 2027-03-13 or 13/03/2027). Nothing personal, by
design: a code is not a password, the published sheet can be read by anyone with its link, and the visuals it opens are
on the site. So any filled cell in another column (a name, a note) refuses the whole sheet, as does a code listed twice.
It fails closed: an unknown code, a set or room the site doesn't have, a bad date or guest number, or a row not updated
for `staleAfterDays` (default 21) asks them to call.

On the demo, `source: "simulated"` with an `example` code (`src/demo/proposal-provider.js`): the home set, a date
four months from today, the first room, 20 guests at a long table, updated two days ago.
