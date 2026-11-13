# Book a table (request)

| | |
|---|---|
| Feature id | `table-request` |
| Plan | starter and above |
| Config | `tableRequest`: `message` (WhatsApp opening line), `maxGuests`, `walkIns?`, `largeGroups?`, `daysAhead?` (default 30), `sittings?` (the sittings that take bookings; all by default); uses `menu.sittings` and `hours.exceptions`; `sections.tableRequest` |
| Files | `table-request.njk`, `table-request.css`, `table-request.js`; message in `src/kits/restaurant/lib/request.js` |

## How it works
Guests, a day (only days a sitting is served and the restaurant isn't closed), a time every 15 minutes up to 30
minutes before last orders (today's past times are left out) and notes. **Send the request** opens WhatsApp with all of
it written out. It's a request: the page says the restaurant replies to confirm. With The Table on, the group's diets and
allergies go in the message and the guest count is filled in; with The Room, the seating preference. Without JavaScript,
a plain WhatsApp link.

## Cafés
`tableRequest.sittings` (optional) limits the form to the sittings that take bookings, e.g. `["brunch"]` for a café
that's walk-in on weekdays. With the brunch builder, the request carries the plates as a pre-order; with the seat
finder, the chosen seat as a preference.
