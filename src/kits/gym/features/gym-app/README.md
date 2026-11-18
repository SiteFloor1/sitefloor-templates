# The app and booking

| | |
|---|---|
| Feature id | `gym-app` |
| Plan | plus and above (a page: `app.html`) |
| Config | `app` `{ title, intro, steps: [{ title, text }], rules: [{ label, text }], stores: [{ name, url }] }` and `booking` |

How to get the club's booking app, in numbered steps; the booking rules in the club's own words (when bookings open,
cancelling and any late-cancel fee, the waitlist, no-shows); a link straight to the app (`booking.url`) and, if given,
its app store pages. The site never books anything itself: every class, slot and pass is booked in the club's app.
