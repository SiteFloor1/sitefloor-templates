# appointment-request (jeweller kit, Starter)

Visit and appointment in one section on the home page (`#appointment`, also `#visit`): the address, today's status
and the grouped opening hours with directions on one side; on the other one line and the appointment in the look's
signature colour. Folded away above it: what it's for and when suits (the house's own choices), a name and a note;
the pieces to have ready come from the tray or the piece whose "See it in person" was tapped. Sent on WhatsApp as a
request: the house replies with times, and nothing is booked until it confirms (`appointments.reply`). Without
JavaScript it is a plain WhatsApp link. With this on, the shared visit card steps aside on the home page (the full
hours table is on Plan your visit).

Config `appointments`: `message`, `reasons`, `when`, optional `reply`. Kept for the date picker (Plus, once the shared
picker is on main): `notice`, `horizon`, `slots`, `minutes`; worked out in `src/kits/jeweller/lib/calendar.js`.
Section copy: `sections.appointment` (`title`, optional `closing` for the line that ends inner pages).
